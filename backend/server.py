from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
import os
import logging
import secrets
import string
import csv
import io
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_data: Dict[str, Any]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CollegeCreate(BaseModel):
    name: str
    yearbook_questions: List[str]
    photo_slots: int = 4

class College(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    yearbook_questions: List[str]
    photo_slots: int
    created_at: str

class StudentBulkUpload(BaseModel):
    college_id: str
    students: List[Dict[str, str]]  # [{"name": "...", "email": "..."}]

class StudentProfile(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None

class YearbookAnswers(BaseModel):
    answers: Dict[int, str]  # {question_index: answer}

class PhotoUpload(BaseModel):
    slot_index: int
    file_id: str
    file_url: str

class Testimonial(BaseModel):
    from_student_id: str
    to_student_id: str
    text: str
    created_at: Optional[str] = None

class TestimonialCreate(BaseModel):
    to_student_id: str
    text: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    user_type: str
    college_id: Optional[str] = None
    profile: Optional[StudentProfile] = None
    yearbook_answers: Optional[Dict[int, str]] = None
    photos: Optional[List[Dict[str, Any]]] = None
    profile_completion: int = 0
    created_at: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_random_password(length: int = 12) -> str:
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_profile_completion(user: Dict[str, Any], college: Dict[str, Any]) -> int:
    score = 0
    total = 4  # profile fields, yearbook answers, photos, basic info
    
    # Check profile fields
    profile = user.get("profile", {})
    if all([profile.get("full_name"), profile.get("nickname"), profile.get("phone"), profile.get("date_of_birth")]):
        score += 1
    
    # Check yearbook answers
    answers = user.get("yearbook_answers", {})
    if len(answers) >= len(college.get("yearbook_questions", [])):
        score += 1
    
    # Check photos
    photos = user.get("photos", [])
    if len(photos) >= college.get("photo_slots", 4):
        score += 1
    
    # Basic info always filled
    score += 1
    
    return int((score / total) * 100)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Yearbook Management API"}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: str = "student"  # "student" or "admin"
    college_id: Optional[str] = None

@api_router.post("/auth/register", response_model=Token)
async def register(register_data: RegisterRequest):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": register_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = {
        "id": secrets.token_urlsafe(16),
        "email": register_data.email,
        "hashed_password": hash_password(register_data.password),
        "user_type": register_data.user_type,
        "college_id": register_data.college_id,
        "profile": {
            "full_name": register_data.full_name
        },
        "yearbook_answers": {},
        "photos": [],
        "profile_completion": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "hashed_password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user["user_type"],
        "user_data": user_data
    }

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "hashed_password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user["user_type"],
        "user_data": user_data
    }

@api_router.post("/colleges", response_model=College)
async def create_college(college: CollegeCreate, user = Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create colleges")
    
    college_data = {
        "id": secrets.token_urlsafe(16),
        "name": college.name,
        "yearbook_questions": college.yearbook_questions,
        "photo_slots": college.photo_slots,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.colleges.insert_one(college_data)
    return College(**college_data)

@api_router.get("/colleges", response_model=List[College])
async def get_colleges(user = Depends(get_current_user)):
    colleges = await db.colleges.find({}, {"_id": 0}).to_list(1000)
    return [College(**c) for c in colleges]

@api_router.post("/students/bulk-upload/debug")
async def debug_bulk_upload(upload_data: StudentBulkUpload, user = Depends(get_current_user)):
    """Debug endpoint to see exactly what data is being received"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload students")
    
    logger.info(f"DEBUG: Received upload_data: {upload_data}")
    logger.info(f"DEBUG: Students count: {len(upload_data.students)}")
    logger.info(f"DEBUG: College ID: {upload_data.college_id}")
    logger.info(f"DEBUG: Students data: {upload_data.students}")
    
    return {
        "debug_info": {
            "college_id": upload_data.college_id,
            "students_count": len(upload_data.students),
            "students": upload_data.students,
            "first_student": upload_data.students[0] if upload_data.students else None
        }
    }

@api_router.post("/students/bulk-upload")
async def bulk_upload_students(upload_data: StudentBulkUpload, user = Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload students")
    
    logger.info(f"=== BULK UPLOAD START ===")
    logger.info(f"College ID: {upload_data.college_id}")
    logger.info(f"Students count: {len(upload_data.students)}")
    logger.info(f"Students data: {upload_data.students}")
    
    college = await db.colleges.find_one({"id": upload_data.college_id}, {"_id": 0})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    # Validate that we have students to upload
    if not upload_data.students or len(upload_data.students) == 0:
        logger.error("ERROR: No students provided for upload")
        raise HTTPException(status_code=400, detail="No students provided for upload")
    
    created_students = []
    skipped_count = 0
    
    for idx, student_data in enumerate(upload_data.students):
        # Validate required fields (name and email are mandatory)
        name = student_data.get("name", "").strip()
        email = student_data.get("email", "").strip()
        phone = student_data.get("phone", "").strip()
        
        if not name or not email:
            logger.warning(f"Skipping student {idx}: missing name or email")
            skipped_count += 1
            continue
            
        password = generate_random_password()
        student = {
            "id": secrets.token_urlsafe(16),
            "email": email,
            "name": name,
            "hashed_password": hash_password(password),
            "plain_password": password,  # Store temporarily for admin to share
            "user_type": "student",
            "college_id": upload_data.college_id,
            "profile": {
                "full_name": name,
                "phone": phone  # Optional phone field
            },
            "yearbook_answers": {},
            "photos": [],
            "profile_completion": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.users.find_one({"email": email})
        if existing:
            logger.warning(f"Student with email {email} already exists, skipping")
            skipped_count += 1
            continue
            
        try:
            await db.users.insert_one(student)
            created_students.append({
                "name": name,
                "email": email,
                "password": password
            })
        except Exception as e:
            logger.error(f"Failed to insert student {email}: {str(e)}")
            skipped_count += 1
    
    if len(created_students) == 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No students created. {skipped_count} students were skipped due to validation errors or duplicates."
        )
    
    return {"created_count": len(created_students), "students": created_students}

@api_router.get("/students")
async def get_students(college_id: Optional[str] = None, user = Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view all students")
    
    query = {"user_type": "student"}
    if college_id:
        query["college_id"] = college_id
    
    students = await db.users.find(query, {"_id": 0, "hashed_password": 0}).to_list(1000)
    
    # Update completion percentages
    for student in students:
        if student.get("college_id"):
            college = await db.colleges.find_one({"id": student["college_id"]}, {"_id": 0})
            if college:
                completion = calculate_profile_completion(student, college)
                await db.users.update_one(
                    {"id": student["id"]},
                    {"$set": {"profile_completion": completion}}
                )
                student["profile_completion"] = completion
    
    return students

@api_router.get("/students/{student_id}")
async def get_student_detail(student_id: str, user = Depends(get_current_user)):
    """Get detailed information about a specific student (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view student details")
    
    student = await db.users.find_one(
        {"id": student_id, "user_type": "student"}, 
        {"_id": 0, "hashed_password": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get college info
    college = None
    if student.get("college_id"):
        college = await db.colleges.find_one({"id": student["college_id"]}, {"_id": 0})
    
    return {
        "student": student,
        "college": college
    }

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, update_data: dict, user = Depends(get_current_user)):
    """Update student profile (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update students")
    
    student = await db.users.find_one({"id": student_id, "user_type": "student"}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Only allow updating specific fields to prevent privilege escalation
    allowed_fields = ["profile", "yearbook_answers"]
    update_dict = {}
    
    for field in allowed_fields:
        if field in update_data:
            if field == "profile":
                # Update nested profile fields
                for key, value in update_data[field].items():
                    update_dict[f"profile.{key}"] = value
            else:
                update_dict[field] = update_data[field]
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one(
        {"id": student_id},
        {"$set": update_dict}
    )
    
    # Recalculate profile completion
    updated_student = await db.users.find_one({"id": student_id}, {"_id": 0})
    college = await db.colleges.find_one({"id": updated_student["college_id"]}, {"_id": 0})
    completion = calculate_profile_completion(updated_student, college)
    
    await db.users.update_one(
        {"id": student_id},
        {"$set": {"profile_completion": completion}}
    )
    
    return {"success": True, "message": "Student updated successfully"}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user = Depends(get_current_user)):
    """Delete a student (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete students")
    
    student = await db.users.find_one({"id": student_id, "user_type": "student"}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete all testimonials related to this student (both written and received)
    await db.testimonials.delete_many({"$or": [
        {"from_student_id": student_id},
        {"to_student_id": student_id}
    ]})
    
    # Delete the student
    result = await db.users.delete_one({"id": student_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete student")
    
    return {"success": True, "message": "Student deleted successfully"}

@api_router.get("/profile")
async def get_profile(user = Depends(get_current_user)):
    college = None
    if user.get("college_id"):
        college = await db.colleges.find_one({"id": user["college_id"]}, {"_id": 0})
    
    completion = calculate_profile_completion(user, college) if college else 0
    
    return {
        "user": {k: v for k, v in user.items() if k != "hashed_password"},
        "college": college,
        "profile_completion": completion
    }

@api_router.put("/profile")
async def update_profile(profile_data: StudentProfile, user = Depends(get_current_user)):
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can update profiles")
    
    update_data = profile_data.model_dump(exclude_none=True)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {f"profile.{k}": v for k, v in update_data.items()}}
    )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    college = await db.colleges.find_one({"id": user["college_id"]}, {"_id": 0})
    completion = calculate_profile_completion(updated_user, college)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"profile_completion": completion}}
    )
    
    return {"success": True, "profile_completion": completion}

@api_router.put("/yearbook-answers")
async def update_yearbook_answers(answers: YearbookAnswers, user = Depends(get_current_user)):
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can update yearbook answers")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"yearbook_answers": {str(k): v for k, v in answers.answers.items()}}}
    )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    college = await db.colleges.find_one({"id": user["college_id"]}, {"_id": 0})
    completion = calculate_profile_completion(updated_user, college)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"profile_completion": completion}}
    )
    
    return {"success": True, "profile_completion": completion}

@api_router.get("/college/students")
async def get_college_students(user = Depends(get_current_user)):
    """Get list of other students from the same college"""
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view college students")
    
    # Get all students from the same college, excluding the current user
    students = await db.users.find(
        {
            "college_id": user["college_id"],
            "user_type": "student",
            "id": {"$ne": user["id"]}
        },
        {"_id": 0, "hashed_password": 0, "plain_password": 0}
    ).to_list(1000)
    
    return students

@api_router.post("/testimonials")
async def create_testimonial(testimonial: TestimonialCreate, user = Depends(get_current_user)):
    """Create a testimonial for another student"""
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can create testimonials")
    
    # Validate word count (max 30 words)
    word_count = len(testimonial.text.strip().split())
    if word_count > 30:
        raise HTTPException(status_code=400, detail=f"Testimonial exceeds 30 words limit ({word_count} words)")
    
    if word_count < 1:
        raise HTTPException(status_code=400, detail="Testimonial cannot be empty")
    
    # Verify the target student exists and is from the same college
    target_student = await db.users.find_one(
        {"id": testimonial.to_student_id, "user_type": "student"}
    )
    if not target_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if target_student.get("college_id") != user.get("college_id"):
        raise HTTPException(status_code=403, detail="Can only write testimonials for students in your college")
    
    # Check if already wrote a testimonial for this student
    existing = await db.testimonials.find_one({
        "from_student_id": user["id"],
        "to_student_id": testimonial.to_student_id
    })
    
    if existing:
        # Update existing testimonial
        await db.testimonials.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "text": testimonial.text,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Testimonial updated", "word_count": word_count}
    else:
        # Create new testimonial
        testimonial_doc = {
            "from_student_id": user["id"],
            "from_student_name": user.get("name", ""),
            "to_student_id": testimonial.to_student_id,
            "text": testimonial.text,
            "word_count": word_count,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.testimonials.insert_one(testimonial_doc)
        return {"success": True, "message": "Testimonial created", "word_count": word_count}

@api_router.get("/testimonials/received")
async def get_received_testimonials(user = Depends(get_current_user)):
    """Get testimonials written for the current student"""
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view testimonials")
    
    testimonials = await db.testimonials.find(
        {"to_student_id": user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return testimonials

@api_router.get("/testimonials/written")
async def get_written_testimonials(user = Depends(get_current_user)):
    """Get testimonials written by the current student"""
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view testimonials")
    
    testimonials = await db.testimonials.find(
        {"from_student_id": user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return testimonials

@api_router.get("/students/{student_id}/testimonials")
async def get_student_testimonials(student_id: str, user = Depends(get_current_user)):
    """Get testimonials for a specific student (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view student testimonials")
    
    testimonials = await db.testimonials.find(
        {"to_student_id": student_id},
        {"_id": 0}
    ).to_list(1000)
    
    return testimonials

@api_router.delete("/testimonials/{from_student_id}/{to_student_id}")
async def delete_testimonial(from_student_id: str, to_student_id: str, user = Depends(get_current_user)):
    """Delete a testimonial (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete testimonials")
    
    result = await db.testimonials.delete_one({
        "from_student_id": from_student_id,
        "to_student_id": to_student_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    return {"success": True, "message": "Testimonial deleted"}

@api_router.put("/testimonials/{from_student_id}/{to_student_id}")
async def update_testimonial(from_student_id: str, to_student_id: str, update_data: dict, user = Depends(get_current_user)):
    """Update a testimonial (admin only)"""
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update testimonials")
    
    # Validate word count if text is being updated
    if "text" in update_data:
        new_text = update_data["text"].strip()
        word_count = len(new_text.split())
        
        if word_count > 30:
            raise HTTPException(status_code=400, detail=f"Testimonial exceeds 30 words limit ({word_count} words)")
        
        if word_count < 1:
            raise HTTPException(status_code=400, detail="Testimonial cannot be empty")
        
        update_data["word_count"] = word_count
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.testimonials.update_one(
        {
            "from_student_id": from_student_id,
            "to_student_id": to_student_id
        },
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    return {"success": True, "message": "Testimonial updated"}

@api_router.get("/drive/connect")
async def connect_drive(user = Depends(get_current_user)):
    try:
        redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", f"{os.getenv('CORS_ORIGINS', '*').split(',')[0]}/api/drive/callback")
        
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            return {"error": "Google Drive not configured. Please set up Google OAuth credentials."}
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/drive.file'],
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=user["id"]
        )
        
        return {"authorization_url": authorization_url}
    except Exception as e:
        logger.error(f"Drive connect failed: {str(e)}")
        return {"error": str(e)}

@api_router.get("/drive/callback")
async def drive_callback(code: str = Query(...), state: str = Query(...)):
    try:
        redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", f"{os.getenv('CORS_ORIGINS', '*').split(',')[0]}/api/drive/callback")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=None,
            redirect_uri=redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        await db.drive_credentials.update_one(
            {"user_id": state},
            {"$set": {
                "user_id": state,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
                "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        frontend_url = os.getenv("CORS_ORIGINS", "*").split(",")[0]
        return {"message": "Drive connected", "redirect": f"{frontend_url}/dashboard?drive_connected=true"}
    except Exception as e:
        logger.error(f"Drive callback failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def get_drive_service(user_id: str):
    creds_doc = await db.drive_credentials.find_one({"user_id": user_id})
    if not creds_doc:
        return None
    
    creds = Credentials(
        token=creds_doc["access_token"],
        refresh_token=creds_doc.get("refresh_token"),
        token_uri=creds_doc["token_uri"],
        client_id=creds_doc["client_id"],
        client_secret=creds_doc["client_secret"],
        scopes=creds_doc["scopes"]
    )
    
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.drive_credentials.update_one(
            {"user_id": user_id},
            {"$set": {
                "access_token": creds.token,
                "expiry": creds.expiry.isoformat() if creds.expiry else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return build('drive', 'v3', credentials=creds)

@api_router.post("/photos/upload")
async def upload_photo(file: UploadFile = File(...), slot_index: int = Query(...), user = Depends(get_current_user)):
    if user["user_type"] != "student":
        raise HTTPException(status_code=403, detail="Only students can upload photos")
    
    try:
        # For MVP, store in MongoDB as base64 (Google Drive is optional)
        contents = await file.read()
        
        # Try Google Drive first
        drive_service = await get_drive_service(user["id"])
        file_url = None
        file_id = None
        
        if drive_service:
            try:
                file_metadata = {'name': f"{user['id']}_slot_{slot_index}_{file.filename}"}
                media = MediaIoBaseUpload(io.BytesIO(contents), mimetype=file.content_type, resumable=True)
                uploaded_file = drive_service.files().create(body=file_metadata, media_body=media, fields='id,webViewLink').execute()
                file_id = uploaded_file.get('id')
                file_url = uploaded_file.get('webViewLink')
            except Exception as e:
                logger.warning(f"Drive upload failed, using MongoDB: {str(e)}")
        
        # Fallback to MongoDB
        if not file_url:
            import base64
            file_url = f"data:{file.content_type};base64,{base64.b64encode(contents).decode()}"
            file_id = secrets.token_urlsafe(16)
        
        # Update user's photos
        photos = user.get("photos", [])
        photos = [p for p in photos if p.get("slot_index") != slot_index]
        photos.append({
            "slot_index": slot_index,
            "file_id": file_id,
            "file_url": file_url,
            "filename": file.filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        })
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"photos": photos}}
        )
        
        updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        college = await db.colleges.find_one({"id": user["college_id"]}, {"_id": 0})
        completion = calculate_profile_completion(updated_user, college)
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"profile_completion": completion}}
        )
        
        return {"success": True, "file_url": file_url, "profile_completion": completion}
    except Exception as e:
        logger.error(f"Photo upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
