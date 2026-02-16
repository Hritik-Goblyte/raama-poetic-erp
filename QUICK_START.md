# 🚀 Quick Start Guide - रामा Local Development

## ⚡ Super Quick Start (Automated)

Just double-click this file:
```
start_local_dev.bat
```

This will:
1. ✅ Setup Python virtual environment
2. ✅ Install all dependencies
3. ✅ Start backend on http://localhost:8001
4. ✅ Start frontend on http://localhost:3000
5. ✅ Open two terminal windows

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ **Python 3.11+** installed
- ✅ **Node.js 18+** installed
- ✅ **MongoDB** running (local or Atlas)

## 🔧 Manual Start (Step by Step)

### 1. Start Backend

Double-click: `start_backend.bat`

Or manually:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 2. Start Frontend (New Terminal)

Double-click: `start_frontend.bat`

Or manually:
```bash
cd frontend
npm install
npm start
```

### 3. Seed Database (First Time Only)

```bash
cd scripts
python seed_db.py
```

## 🌐 Access Points

Once running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:8001 | API server |
| **API Docs** | http://localhost:8001/docs | Swagger documentation |
| **Health Check** | http://localhost:8001/health | Server status |

## 👤 Demo Accounts

After seeding the database:

**Writer Account:**
- Email: `writer@raama.com`
- Password: `password123`

**Reader Account:**
- Email: `reader@raama.com`
- Password: `password123`

## ✨ Testing New Loading Animations

1. **Login** with demo account
2. **Refresh Dashboard** (F5) to see:
   - 🎨 Main loading screen with रामा branding
   - 💀 Skeleton loaders for cards
   - 🔢 Counting animations (0 → actual number)
   - ✨ Smooth fade-in transitions

3. **Switch Tabs:**
   - Click "All Shayaris" → See loading spinner
   - Click "Trending" → See skeleton loaders
   - Click "Featured" → See animations

4. **Simulate Slow Network:**
   - Press F12 (DevTools)
   - Go to Network tab
   - Change throttling to "Slow 3G"
   - Refresh page

## ❌ Common Issues

### "Not Found" Error on Login

**Fix:** Check `frontend/.env` has:
```env
REACT_APP_API_URL=http://localhost:8001
```

Then restart frontend (Ctrl+C and run again).

### "Connection Refused"

**Fix:** Backend is not running. Start it with `start_backend.bat`

### "CORS Error"

**Fix:** Check `backend/.env` has:
```env
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

Then restart backend.

### "Invalid Credentials"

**Fix:** Run the seed script:
```bash
cd scripts
python seed_db.py
```

## 📚 More Help

- **Detailed Troubleshooting:** See `TROUBLESHOOTING_GUIDE.md`
- **Full Documentation:** See `README.md`
- **Production Deployment:** See `PRODUCTION_READY_SUMMARY.md`

## 🛑 Stopping Servers

- Close the terminal windows, or
- Press `Ctrl+C` in each terminal

## 🔄 Restarting After Changes

**Backend changes:** Server auto-reloads (using `--reload` flag)

**Frontend changes:** React auto-reloads

**Environment variable changes:** Must restart manually:
1. Press `Ctrl+C` to stop
2. Run start script again

---

**Happy Coding! 🎉**
