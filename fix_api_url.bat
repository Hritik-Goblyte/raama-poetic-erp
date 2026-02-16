@echo off
echo ========================================
echo Fixing API URL Issue
echo ========================================
echo.

echo Current frontend/.env content:
type frontend\.env
echo.

echo Stopping any running frontend...
taskkill /f /im node.exe 2>nul

echo Clearing cache...
cd frontend
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .cache rmdir /s /q .cache

echo.
echo Verifying .env file...
if not exist .env (
    echo ERROR: .env file not found!
    echo Creating .env file...
    echo REACT_APP_API_URL=https://raama-backend-srrb.onrender.com > .env
    echo .env file created.
) else (
    echo .env file exists.
)

echo.
echo Content of .env:
type .env

echo.
echo Starting frontend with debug info...
echo Watch the console for debug messages!
echo.

npm start