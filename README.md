# Yearbook Application

A full-stack application for managing student yearbooks with admin and student functionalities. Built with React on the frontend and FastAPI on the backend.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Features](#features)

## 📦 Prerequisites

### System Requirements

- **macOS** (or your operating system)
- **Git** (for version control)

### Backend Requirements

- **Python 3.9+** (recommended: Python 3.10 or 3.11)
  - Check your Python version: `python3 --version`
  - Install Python from [python.org](https://www.python.org/downloads/)

- **Virtual Environment** (venv)
  - For creating isolated Python environments

### Frontend Requirements

- **Node.js**: v18.20.8 or higher
  - Check your Node version: `node --version`
  - Install Node.js from [nodejs.org](https://nodejs.org/)

- **npm**: v10.8.2 or higher (comes with Node.js)
  - Check npm version: `npm --version`

### Database

- **MongoDB** (cloud instance via MONGO_URL)
  - Ensure you have access to a MongoDB connection string

## 🏗️ Project Structure

```
yearbook_source/
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (create this)
│   └── __pycache__/           # Python cache
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── index.js           # React entry point
│   │   ├── components/        # React components
│   │   │   ├── admin/         # Admin dashboard components
│   │   │   ├── student/       # Student components
│   │   │   └── ui/            # UI components (Radix UI)
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Utility functions
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── craco.config.js        # Create React App override
├── tests/                     # Test directory
├── design_guidelines.json     # Design guidelines
└── README.md                  # This file
```

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   # macOS/Linux
   source venv/bin/activate
   
   # Windows
   venv\Scripts\activate
   ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create `.env` file in the backend directory with the following variables:**
   ```
   MONGO_URL=your_mongodb_connection_string
   DB_NAME=yearbook_db
   SECRET_KEY=your_secret_key_here_change_in_production
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > **Note:** We use `--legacy-peer-deps` due to peer dependency conflicts between React 19 and some libraries.

3. **Verify dependencies are installed correctly:**
   ```bash
   npm list
   ```

## ▶️ Running the Application

### Start the Backend

1. **From the backend directory, with virtual environment activated:**
   ```bash
   python server.py
   ```
   
   Or using FastAPI's uvicorn:
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```
   
   The backend will run at: `http://localhost:8000`

### Start the Frontend

1. **From the frontend directory:**
   ```bash
   npm start
   ```
   
   The frontend will automatically open at: `http://localhost:3000`

### Running Both Simultaneously

**In separate terminal windows:**

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
python server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## 🔧 Environment Variables

### Backend `.env` file

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | Database name | `yearbook_db` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `xxxxx` |

## ✨ Features

### Admin Features
- Manage colleges and student information
- Upload and manage student photos
- Export yearbook data

### Student Features
- View and edit profile information
- Upload photos
- Browse yearbook
- View other students' profiles

### Authentication
- JWT token-based authentication
- Google OAuth integration
- Secure password hashing

### Technology Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (NoSQL database)
- Motor (async MongoDB driver)
- JWT (authentication)
- Google APIs (OAuth and Drive integration)

**Frontend:**
- React 19
- React Router v6
- Tailwind CSS
- Radix UI (component library)
- Axios (API client)
- React Hook Form (form management)

## 🔗 API Endpoints

The backend API is available at `http://localhost:8000` with the following main endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/students` - Get all students
- `GET /api/colleges` - Get all colleges
- `POST /api/upload/photo` - Upload student photo
- `GET /api/yearbook` - Get yearbook data

## 📝 Notes

- Make sure both backend and frontend are running for the application to work properly
- MongoDB connection must be available for the backend to function
- Use `--legacy-peer-deps` when installing frontend dependencies
- Python 3.9+ is required for the backend
- Node.js 18+ is required for the frontend

## 🐛 Troubleshooting

### Backend Issues
- **Import errors**: Ensure virtual environment is activated
- **MongoDB connection**: Verify `MONGO_URL` in `.env` is correct
- **Port already in use**: Change port with `--port 8001`

### Frontend Issues
- **Module not found**: Run `npm install --legacy-peer-deps` again
- **Port 3000 in use**: Set `PORT=3001 npm start`
- **Dependencies conflict**: Clear cache with `npm cache clean --force`

## 📧 Contact & Support

For issues or questions, refer to the design guidelines in `design_guidelines.json`
