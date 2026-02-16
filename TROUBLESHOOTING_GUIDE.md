# 🔧 Troubleshooting Guide - Local Development

## Issue: Login shows "Not Found" error

### Problem
When trying to login locally, you get a "Not Found" error even though login works on the production site.

### Root Cause
The frontend `.env` file is pointing to the wrong backend URL.

### Solution

#### Step 1: Fix Frontend Environment Variables

Edit `frontend/.env` and make sure it has:

```env
REACT_APP_API_URL=http://localhost:8001
```

**NOT:**
```env
REACT_APP_API_URL=https://raama-backend-srrb.onrender.com/
```

#### Step 2: Fix Backend Environment Variables

Edit `backend/.env` and make sure it has:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="raama_development"
JWT_SECRET="your-super-secret-jwt-key-for-development-min-32-chars"
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

#### Step 3: Restart Both Services

**Important:** After changing `.env` files, you MUST restart both frontend and backend!

**Backend:**
```bash
# Stop the backend (Ctrl+C in the terminal)
# Then restart:
cd backend
venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Frontend:**
```bash
# Stop the frontend (Ctrl+C in the terminal)
# Then restart:
cd frontend
npm start
```

#### Step 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or simply:
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- Reload the page

### Verification Steps

1. **Check Backend is Running:**
   - Open: http://localhost:8001
   - You should see: `{"message": "रामा - The Poetic ERP API", ...}`

2. **Check Backend Health:**
   - Open: http://localhost:8001/health
   - You should see: `{"status": "healthy", ...}`

3. **Check API Docs:**
   - Open: http://localhost:8001/docs
   - You should see the FastAPI Swagger documentation

4. **Check Frontend:**
   - Open: http://localhost:3000
   - You should see the login page

5. **Test Login:**
   - Email: `writer@raama.com`
   - Password: `password123`

### Common Issues

#### Issue: "Connection Refused" or "Network Error"

**Cause:** Backend is not running

**Solution:**
```bash
cd backend
venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Issue: "CORS Error"

**Cause:** CORS_ORIGINS in backend `.env` doesn't include `http://localhost:3000`

**Solution:**
Edit `backend/.env`:
```env
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

Then restart backend.

#### Issue: "Database Connection Error"

**Cause:** MongoDB is not running

**Solution:**
- **If using local MongoDB:** Start MongoDB service
  ```bash
  # Windows
  net start MongoDB
  
  # Or start MongoDB manually
  mongod --dbpath C:\data\db
  ```

- **If using MongoDB Atlas:** Update `MONGO_URL` in `backend/.env` with your Atlas connection string

#### Issue: "No users found" or "Invalid credentials"

**Cause:** Database is empty

**Solution:**
```bash
cd scripts
python seed_db.py
```

This creates demo accounts:
- Writer: `writer@raama.com` / `password123`
- Reader: `reader@raama.com` / `password123`

#### Issue: Changes not reflecting

**Cause:** Browser cache or React not detecting changes

**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Stop frontend (Ctrl+C)
3. Delete `frontend/node_modules/.cache`
4. Restart: `npm start`

### Quick Reset Script

If nothing works, try this complete reset:

```bash
# Stop all services (Ctrl+C in all terminals)

# Backend reset
cd backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend reset
cd ../frontend
rmdir /s /q node_modules
rmdir /s /q .cache
npm install

# Seed database
cd ../scripts
python seed_db.py

# Start backend
cd ../backend
venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# In new terminal, start frontend
cd frontend
npm start
```

### Environment Variables Checklist

**Backend `.env`:**
- [ ] `MONGO_URL` points to local MongoDB or Atlas
- [ ] `DB_NAME` is set (e.g., `raama_development`)
- [ ] `JWT_SECRET` is set (any string, min 32 chars)
- [ ] `CORS_ORIGINS` includes `http://localhost:3000`
- [ ] `FRONTEND_URL` is `http://localhost:3000`

**Frontend `.env`:**
- [ ] `REACT_APP_API_URL` is `http://localhost:8001`
- [ ] NO trailing slash in the URL

### Still Having Issues?

1. **Check Console Errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Share the error message for help

2. **Check Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try to login
   - Look for failed requests (red)
   - Click on the failed request to see details

3. **Check Backend Logs:**
   - Look at the terminal where backend is running
   - Check for error messages
   - Share the error for help

### Testing the New Loading Animations

Once everything is working:

1. **Login** with demo account
2. **Refresh Dashboard** (F5) to see:
   - Main loading screen with रामा branding
   - Skeleton loaders for cards
   - Counting animations (0 → actual number)
   - Smooth fade-in transitions

3. **Test Different Tabs:**
   - Click "All Shayaris" to see loading spinner
   - Click "Trending" to see skeleton loaders
   - Click "Featured" to see animations

4. **Simulate Slow Network:**
   - Open DevTools (F12)
   - Go to Network tab
   - Change throttling to "Slow 3G"
   - Refresh page to see longer loading animations

Enjoy the smooth loading experience! 🎉
