# 🔧 Registration → OTP Redirect Debug Guide

## 🚨 Issue: After registration, redirecting to login instead of OTP page

### 🔍 Debug Steps:

#### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to **Console** tab
3. Register a new user
4. Look for these messages:
   ```
   Submitting to: /auth/register with data: {...}
   Response: {...}
   Registration successful, redirecting to OTP page with email: user@example.com
   ```

#### Step 2: Check Network Tab
1. Open **Network** tab in developer tools
2. Register a new user
3. Check if `/auth/register` request is successful (200 status)
4. Check the response body

#### Step 3: Test OTP Page Directly
1. On login page, click **"[Debug: Test OTP Page]"** button
2. This should take you directly to OTP verification page
3. If this works, the issue is with the registration redirect

#### Step 4: Check for JavaScript Errors
1. Look for any red errors in console
2. Check if there are any import/module errors
3. Verify all components are loading properly

### 🎯 Expected Flow:
1. User fills registration form
2. Clicks "Register" button
3. Backend creates user with `emailVerified: false`
4. Backend sends OTP email
5. Backend returns success response
6. Frontend shows success toast
7. Frontend redirects to `/verify-otp` with email in state
8. OTP page loads with email field populated

### 🔧 Common Issues:

#### Issue 1: Registration Error
- Check if registration is actually successful
- Look for error messages in console
- Verify all required fields are filled

#### Issue 2: Navigation Error
- Check if React Router is working
- Verify `/verify-otp` route exists
- Check for JavaScript errors

#### Issue 3: State Not Passed
- Email might not be passed in navigation state
- Check `location.state` in OTP component

### 🚀 Quick Test:

Try registering with these details:
```
First Name: Test
Last Name: User
Username: testuser123
Email: your-email@gmail.com
Password: password123
```

### 📧 Check Email:
After registration, check your email for OTP. If you receive OTP but page doesn't redirect, the issue is frontend navigation.

### 🎯 Manual Navigation Test:
1. Go to: `http://localhost:3000/verify-otp`
2. It should redirect to login (no email in state)
3. Use debug button to test with email state

### 💡 Temporary Workaround:
If redirect isn't working, you can:
1. Note the OTP from your email
2. Manually go to `/verify-otp`
3. It will redirect to login
4. Use the debug button to access OTP page
5. Enter the OTP you received

This will help us identify if the issue is with:
- Registration process ❌
- Navigation/routing ❌  
- OTP page itself ❌