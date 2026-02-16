@echo off
echo ========================================
echo Starting रामा Frontend
echo ========================================
echo.

cd frontend

if not exist node_modules (
    echo Installing Node.js dependencies...
    npm install
    echo.
)

echo Starting Frontend Development Server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start