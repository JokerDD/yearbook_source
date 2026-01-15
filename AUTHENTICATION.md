# Authentication Setup Guide

## Quick Start - Demo Credentials

The application now supports both **Sign Up** and **Login** functionality.

### Option 1: Use Demo Credentials (Quick Test)

1. **Run the demo data setup script:**
   ```bash
   cd backend
   source venv/bin/activate
   python create_demo_data.py
   ```

2. **Demo Credentials:**
   - **Student Account:**
     - Email: `demo@yearbook.com`
     - Password: `demo123456`
   
   - **Admin Account:**
     - Email: `admin@yearbook.com`
     - Password: `admin123456`

### Option 2: Create Your Own Account (Sign Up)

1. Start the frontend: `npm start` (from frontend directory)
2. Click **"Sign Up"** on the login page
3. Fill in your details:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Confirm Password
4. Click **"Create Account"**
5. You'll be automatically logged in and redirected to your dashboard

## Backend API Endpoints

### Authentication

- **POST `/api/auth/register`** - Create a new account
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "full_name": "John Doe",
    "user_type": "student",
    "college_id": "optional_college_id"
  }
  ```

- **POST `/api/auth/login`** - Login to existing account
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

## How It Works

1. **Frontend** sends credentials to backend
2. **Backend** validates and hashes password
3. **JWT Token** is generated and returned
4. **Frontend** stores token in localStorage
5. **Protected routes** require valid token
6. **User is redirected** to appropriate dashboard (admin or student)

## Features by User Type

### Student
- View profile
- Complete yearbook questionnaire
- Upload photos
- Browse yearbook
- Edit profile information

### Admin
- Manage colleges
- Bulk upload students
- View all students
- Generate reports

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Sensitive credentials stored in `.env` file
- Never commit `.env` to git

## Troubleshooting

**"Email already registered"**
- The email is already in the database
- Use a different email or use the demo account

**"Incorrect email or password"**
- Check your email and password spelling
- Verify you're using the correct credentials

**"Not authenticated"**
- Your token has expired (24 hours)
- Log out and log back in

## Next Steps

1. ✅ Try logging in with demo credentials
2. ✅ Create your own account
3. ✅ Update your profile
4. ✅ Complete the yearbook questionnaire
5. ✅ Upload photos
