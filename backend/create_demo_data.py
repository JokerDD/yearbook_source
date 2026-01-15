#!/usr/bin/env python3
"""
Script to create demo credentials and test data in MongoDB
Run this script to populate your database with demo data for testing
"""

import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import secrets
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_demo_data():
    """Create demo users and colleges"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'yearbook_db')
    
    if not mongo_url:
        print("❌ Error: MONGO_URL not found in .env file")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print("🚀 Creating demo data...")
        
        # Clear existing demo data (optional)
        # await db.users.delete_many({"email": {"$in": ["demo@yearbook.com", "admin@yearbook.com"]}})
        # await db.colleges.delete_many({"name": "Demo College"})
        
        # Create a demo college
        college = {
            "id": secrets.token_urlsafe(16),
            "name": "Demo College",
            "yearbook_questions": [
                "What is your favorite memory from college?",
                "What are you most proud of?",
                "Share your future aspirations:",
                "A message to your friends:"
            ],
            "photo_slots": 4,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing_college = await db.colleges.find_one({"name": "Demo College"})
        if not existing_college:
            result = await db.colleges.insert_one(college)
            print(f"✅ Created college: {college['name']} (ID: {college['id']})")
        else:
            college = existing_college
            print(f"ℹ️  College already exists: {college['name']}")
        
        # Create demo student user
        demo_student = {
            "id": secrets.token_urlsafe(16),
            "email": "demo@yearbook.com",
            "hashed_password": pwd_context.hash("demo123456"),
            "user_type": "student",
            "college_id": college["id"],
            "profile": {
                "full_name": "Demo Student",
                "nickname": "Demo",
                "phone": "+1-555-0123",
                "date_of_birth": "2003-05-15"
            },
            "yearbook_answers": {
                "0": "Making friends and learning new things!",
                "1": "Completing my first major project",
                "2": "Become a software engineer",
                "3": "Thanks for the great memories!"
            },
            "photos": [],
            "profile_completion": 75,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing_student = await db.users.find_one({"email": "demo@yearbook.com"})
        if not existing_student:
            await db.users.insert_one(demo_student)
            print(f"✅ Created student user: {demo_student['email']}")
        else:
            print(f"ℹ️  Student user already exists: {demo_student['email']}")
        
        # Create demo admin user
        demo_admin = {
            "id": secrets.token_urlsafe(16),
            "email": "admin@yearbook.com",
            "hashed_password": pwd_context.hash("admin123456"),
            "user_type": "admin",
            "college_id": None,
            "profile": {
                "full_name": "Admin User"
            },
            "yearbook_answers": {},
            "photos": [],
            "profile_completion": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing_admin = await db.users.find_one({"email": "admin@yearbook.com"})
        if not existing_admin:
            await db.users.insert_one(demo_admin)
            print(f"✅ Created admin user: {demo_admin['email']}")
        else:
            print(f"ℹ️  Admin user already exists: {demo_admin['email']}")
        
        print("\n" + "="*50)
        print("📋 DEMO CREDENTIALS")
        print("="*50)
        print("\n👨‍🎓 Student Account:")
        print("   Email: demo@yearbook.com")
        print("   Password: demo123456")
        print("\n👨‍💼 Admin Account:")
        print("   Email: admin@yearbook.com")
        print("   Password: admin123456")
        print("\n" + "="*50)
        print("✨ Demo data created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_demo_data())
