@echo off
echo Starting रामा Local Development Environment...
echo.

echo ========================================
echo Setting up Backend...
echo ========================================
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo Starting Backend Server...
start "रामा Backend - http://localhost:8001" cmd /k "cd /d %CD% && venv\Scripts\activate && uvicorn server:app --reload --host 0.0.0.0 --port 8001"

cd ..

echo.
echo ========================================
echo Setting up Frontend...
echo ========================================
cd frontend

if not exist node_modules (
    echo Installing Node.js dependencies...
    npm install
)

echo Starting Frontend Development Server...
start "रामा Frontend - http://localhost:3000" cmd /k "cd /d %CD% && npm start"

cd ..

echo.
echo ========================================
echo रामा Development Environment Started!
echo ========================================
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8001/docs
echo.
echo Two new windows have opened:
echo 1. Backend Server (port 8001)
echo 2. Frontend Server (port 3000)
echo.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause > nul