# Backend Dependency Fix Guide

## Problem
The backend server is failing to start due to a `pydantic_core` module error after installing Google Generative AI.

## Quick Fix Options

### Option 1: Use the Fix Script (Recommended)
Run one of these files I created:
- **fix-backend-dependencies.bat** (double-click)
- **fix-backend-dependencies.ps1** (PowerShell)

### Option 2: Manual Fix
1. **Activate virtual environment:**
   ```cmd
   cd backend
   ..\venv\Scripts\activate
   ```

2. **Reinstall pydantic packages:**
   ```cmd
   pip uninstall pydantic pydantic-core -y
   pip install pydantic==2.12.5 pydantic-core==2.41.5
   ```

3. **Verify Google Generative AI is still installed:**
   ```cmd
   pip show google-generativeai
   ```

4. **Start the server:**
   ```cmd
   uvicorn server:app --reload --port 8001
   ```

### Option 3: Fresh Install (If above doesn't work)
1. **Recreate virtual environment:**
   ```cmd
   rmdir /s venv
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install all requirements:**
   ```cmd
   cd backend
   pip install -r requirements.txt
   ```

## What Happened?
- Installing `google-generativeai` updated some dependencies
- This caused a version conflict with `pydantic_core`
- The fix reinstalls the correct compatible versions

## After Fix
Your backend should start successfully with:
```cmd
uvicorn server:app --reload --port 8001
```

And you'll have both:
✅ **Google Gemini AI** for translation
✅ **All existing functionality** working properly