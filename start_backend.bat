@echo off
echo ========================================
echo Starting रामा Backend Server
echo ========================================
echo.

cd backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/Updating dependencies...
pip install -r requirements.txt
echo.

echo Starting Backend Server on http://localhost:8001
echo API Documentation: http://localhost:8001/docs
echo Health Check: http://localhost:8001/health
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn server:app --reload --host 0.0.0.0 --port 8001