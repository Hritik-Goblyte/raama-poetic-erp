@echo off
echo ========================================
echo Testing रामा with Production Backend
echo ========================================
echo.
echo Configuration:
echo - Frontend: http://localhost:3000 (Local)
echo - Backend: https://raama-backend-srrb.onrender.com (Production)
echo.
echo This allows you to test new features locally
echo while using real production data.
echo.
echo ========================================

cd frontend

if not exist node_modules (
    echo Installing Node.js dependencies...
    npm install
    echo.
)

echo Starting Frontend Development Server...
echo.
echo Once started:
echo 1. Open http://localhost:3000
echo 2. Login with your production credentials
echo 3. Test the new loading animations!
echo.
echo Tips for testing:
echo - Press F5 to refresh and see loading screen
echo - Use F12 Network tab to simulate slow network
echo - Switch between tabs to see different loaders
echo.
echo Press Ctrl+C to stop the server
echo.

npm start