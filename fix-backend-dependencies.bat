@echo off
echo Fixing backend dependencies...
cd backend

echo Activating virtual environment...
call ..\venv\Scripts\activate

echo Reinstalling pydantic and pydantic-core...
pip uninstall pydantic pydantic-core -y
pip install pydantic==2.12.5 pydantic-core==2.41.5

echo Checking if google-generativeai is still installed...
pip show google-generativeai

echo.
echo Dependencies fixed! Try starting the backend server again.
echo Command: uvicorn server:app --reload --port 8001
pause