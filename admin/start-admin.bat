@echo off
echo 🚀 Starting Raama Admin Dashboard...
echo ==================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Set environment variables
set PORT=3001
set REACT_APP_BACKEND_URL=http://localhost:8001
set REACT_APP_ADMIN_SECRET=raama-admin-2024

echo.
echo 🔐 Admin Dashboard Security Info:
echo    Port: 3001
echo    URL: http://localhost:3001
echo    Secret Key: raama-admin-2024
echo.
echo 👤 Default Admin Credentials:
echo    Email: admin@raama.com
echo    Password: admin123
echo.
echo ⚠️  Remember to:
echo    1. Create admin user with: python ../scripts/create_admin.py
echo    2. Change default password after first login
echo    3. Update admin secret in production
echo.

REM Start the admin dashboard
npx react-scripts start