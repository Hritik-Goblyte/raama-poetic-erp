# 🔍 Debug API URL Issue

## 🚨 Problem

Backend logs show:
```
"POST //api/auth/login HTTP/1.1" 404 Not Found
```

The double slash `//api/auth/login` indicates the API URL is not being constructed correctly.

## 🔧 Quick Fix

### Step 1: Stop Frontend
Press `Ctrl+C` in the terminal running the frontend.

### Step 2: Clear Cache
```bash
cd frontend
rmdir /s /q node_modules\.cache
# Or on Linux/Mac: rm -rf node_modules/.cache
```

### Step 3: Verify Environment Variable
Add this debug code to `frontend/src/pages/Login.js` at the top:

```javascript
// Add this after the imports, before the component
console.log('🔍 DEBUG - Environment Variables:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('BACKEND_URL:', BACKEND_URL);
console.log('API:', API);
console.log('Full login URL:', `${API}/auth/login`);
```

### Step 4: Restart Frontend
```bash
npm start
```

### Step 5: Check Console
1. Open http://localhost:3000
2. Press F12 (DevTools)
3. Go to Console tab
4. Look for the debug messages

## 🎯 Expected Output

You should see:
```
🔍 DEBUG - Environment Variables:
REACT_APP_API_URL: https://raama-backend-srrb.onrender.com
BACKEND_URL: https://raama-backend-srrb.onrender.com
API: https://raama-backend-srrb.onrender.com/api
Full login URL: https://raama-backend-srrb.onrender.com/api/auth/login
```

## ❌ If You See Problems

### Problem 1: REACT_APP_API_URL is undefined
```
REACT_APP_API_URL: undefined
```

**Solution:** Environment variable not loading
1. Check `frontend/.env` exists
2. Restart frontend completely
3. Make sure no trailing spaces in .env file

### Problem 2: Double slash in URL
```
API: https://raama-backend-srrb.onrender.com//api
```

**Solution:** Trailing slash in BACKEND_URL
1. Remove trailing slash from .env
2. Restart frontend

### Problem 3: Using fallback URL
```
BACKEND_URL: https://raama-backend-srrb.onrender.com
```
But REACT_APP_API_URL shows undefined

**Solution:** .env file not being read
1. Make sure file is named exactly `.env` (not `.env.txt`)
2. Make sure it's in `frontend/` folder
3. Restart frontend

## 🚀 Alternative Quick Fix

If debugging is too complex, try this immediate fix:

### Option 1: Hardcode the URL (Temporary)
Edit `frontend/src/pages/Login.js`:

```javascript
// Replace this line:
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';

// With this:
const BACKEND_URL = 'https://raama-backend-srrb.onrender.com';
```

Do the same in all files that use `BACKEND_URL`.

### Option 2: Create a config file
Create `frontend/src/config.js`:

```javascript
export const API_BASE_URL = 'https://raama-backend-srrb.onrender.com';
```

Then in each component:
```javascript
import { API_BASE_URL } from '@/config';
const API = `${API_BASE_URL}/api`;
```

## 🔄 Complete Reset (Nuclear Option)

If nothing works:

```bash
# Stop frontend (Ctrl+C)
cd frontend

# Delete cache and node_modules
rmdir /s /q node_modules
rmdir /s /q .cache

# Reinstall
npm install

# Verify .env content
type .env

# Should show:
# REACT_APP_API_URL=https://raama-backend-srrb.onrender.com

# Start fresh
npm start
```

## 📝 Common Causes

1. **Trailing slash in .env:** `https://example.com/` → `https://example.com//api`
2. **Environment variable not loading:** Falls back to hardcoded URL
3. **Cache issues:** Old values cached
4. **File naming:** `.env.txt` instead of `.env`
5. **File location:** `.env` not in `frontend/` folder

## ✅ Verification

Once fixed, you should see in Network tab (F12):
```
POST https://raama-backend-srrb.onrender.com/api/auth/login
```

NOT:
```
POST //api/auth/login
```

## 🎯 Next Steps

1. Try the debug approach first
2. If that doesn't work, use the hardcode fix
3. Once working, test the loading animations!
4. The animations will work perfectly once the API calls succeed

Let me know what the debug console shows!