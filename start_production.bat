@echo off
REM Production startup script for रामा - The Poetic ERP (Windows)
REM Make sure to update environment variables before running

echo 🚀 Starting रामा Production Deployment...

REM Backend setup
echo 🔧 Setting up Backend...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements_clean.txt

REM Check environment variables
if not exist ".env" (
    echo ❌ Backend .env file not found!
    echo Please create backend/.env with production values
    echo See DEPLOYMENT_GUIDE.md for details
    pause
    exit /b 1
)

REM Start backend
echo 🚀 Starting Backend Server...
start "Backend Server" cmd /k "uvicorn server:app --host 0.0.0.0 --port 8001"

cd ..

REM Frontend setup
echo 🎨 Setting up Frontend...
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing Frontend dependencies...
    yarn install
)

REM Check environment variables
if not exist ".env" (
    echo ❌ Frontend .env file not found!
    echo Please create frontend/.env with production values
    pause
    exit /b 1
)

REM Build frontend
echo 🏗️  Building Frontend...
yarn build

REM Serve frontend (for testing - use proper web server in production)
echo 🌐 Starting Frontend Server...
start "Frontend Server" cmd /k "npx serve -s build -l 3000"

cd ..

REM Admin setup
echo 👑 Setting up Admin Panel...
cd admin

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing Admin dependencies...
    npm install
)

REM Check environment variables
if not exist ".env" (
    echo ❌ Admin .env file not found!
    echo Please create admin/.env with production values
    pause
    exit /b 1
)

REM Build admin
echo 🏗️  Building Admin Panel...
npm run build

REM Serve admin (for testing - use proper web server in production)
echo 🌐 Starting Admin Panel...
start "Admin Panel" cmd /k "npx serve -s build -l 3001"

cd ..

echo ✅ All services started successfully!
echo.
echo 🌐 Services running on:
echo    Backend:  http://localhost:8001
echo    Frontend: http://localhost:3000
echo    Admin:    http://localhost:3001
echo.
echo 📚 API Documentation: http://localhost:8001/docs
echo.
echo ⚠️  Note: This script is for testing. Use proper web servers (IIS, Nginx) in production.
echo.
echo Press any key to exit...
pause >nul