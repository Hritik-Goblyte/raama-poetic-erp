# 🪟 Windows Setup Guide for Raama Admin

Quick setup guide specifically for Windows users.

## 🚀 Quick Start (Windows)

### Method 1: Using Batch File (Easiest)
```cmd
cd admin
start-admin.bat
```

### Method 2: Using PowerShell
```powershell
cd admin
.\start-admin.ps1
```

### Method 3: Manual Setup
```cmd
cd admin
npm install
set PORT=3001
set REACT_APP_BACKEND_URL=http://localhost:8001
set REACT_APP_ADMIN_SECRET=raama-admin-2024
npx react-scripts start
```

## 🔧 Troubleshooting Windows Issues

### Issue: 'REACT_APP_PORT' is not recognized
**Solution**: Use one of the Windows-specific start methods above.

### Issue: PowerShell execution policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: npm not found
1. Install Node.js from https://nodejs.org/
2. Restart command prompt
3. Verify with: `node --version`

### Issue: Python not found
1. Install Python from https://python.org/
2. Add Python to PATH during installation
3. Verify with: `python --version`

## 📋 Prerequisites Check

Run these commands to verify your setup:

```cmd
node --version
npm --version
python --version
```

Expected output:
- Node.js: v18.0.0 or higher
- npm: v8.0.0 or higher  
- Python: v3.11.0 or higher

## 🎯 Complete Windows Setup

### 1. Install Prerequisites
- Download and install Node.js from https://nodejs.org/
- Download and install Python from https://python.org/
- Ensure MongoDB is running

### 2. Create Admin User
```cmd
cd scripts
python create_admin.py
```

### 3. Start Backend (in separate terminal)
```cmd
cd backend
python server.py
```

### 4. Start Admin Dashboard
```cmd
cd admin
start-admin.bat
```

### 5. Access Dashboard
- Open browser to: http://localhost:3001
- Email: admin@raama.com
- Password: admin123
- Admin Secret: raama-admin-2024

## 🔐 Security Notes for Windows

### Environment Variables
Create `.env` file in admin folder:
```
PORT=3001
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_ADMIN_SECRET=raama-admin-2024
```

### Firewall Configuration
Windows may prompt to allow Node.js through firewall:
- Click "Allow access" for private networks
- This is needed for localhost access

### Antivirus Considerations
Some antivirus software may flag Node.js:
- Add Node.js installation folder to exclusions
- Add project folder to exclusions

## 🚨 Common Windows Errors

### Error: Cannot find module
```cmd
cd admin
npm install
```

### Error: Port already in use
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

### Error: Permission denied
- Run command prompt as Administrator
- Or use PowerShell with elevated privileges

## 📞 Windows-Specific Support

If you encounter Windows-specific issues:

1. **Check Node.js installation**: `where node`
2. **Check npm installation**: `where npm`
3. **Check Python installation**: `where python`
4. **Verify ports are free**: `netstat -ano | findstr :3001`
5. **Check Windows version**: `winver`

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Admin dashboard opens at http://localhost:3001
- ✅ Login form appears with Raama branding
- ✅ No console errors in browser
- ✅ Backend API calls succeed

---

**💡 Tip**: Keep the backend server running in one terminal and admin dashboard in another for best experience.