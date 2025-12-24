# 🚀 Quick Fix: EmailJS Not Delivering Emails

## 🎯 **Most Common Issue: Template "To" Field**

### Step 1: Check Your EmailJS Template
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click on your template (`template_052uhen`)

### Step 2: Fix the "To" Field
**This is the most common issue!**

In your template settings, make sure:
- **To:** `{{to_email}}`
- **NOT:** your-email@gmail.com (hardcoded)
- **NOT:** empty

### Step 3: Verify Template Variables
Your backend sends these exact variables:
```
to_email → Recipient email address
user_name → User's first name  
otp_code → 6-digit OTP (123456)
from_name → "रामा Team"
from_email → "raama.info@gmail.com"
expiry_time → "10 minutes"
```

### Step 4: Use This Working Template

**Subject:** `Your रामा OTP: {{otp_code}}`

**Body:**
```
Hello {{user_name}},

Welcome to रामा! Your verification code is:

{{otp_code}}

This code expires in {{expiry_time}}.

Please enter this code on the verification page.

Best regards,
{{from_name}}
{{from_email}}
```

### Step 5: Test Template
1. In EmailJS dashboard, click **"Test"** on your template
2. Fill in test values:
   - `to_email`: your-actual-email@gmail.com
   - `user_name`: Test User
   - `otp_code`: 123456
   - `from_name`: रामा Team
   - `from_email`: raama.info@gmail.com
   - `expiry_time`: 10 minutes
3. Click **Send Test**
4. Check your email (including spam folder)

## 🔍 **Other Quick Checks:**

### Check 1: Email Service
- Is your Gmail service properly connected in EmailJS?
- Try disconnecting and reconnecting Gmail service

### Check 2: Spam Folder
- Check Gmail spam folder
- Check "Promotions" tab
- Check "Updates" tab

### Check 3: Email Address
- Try with different email address (Yahoo, Outlook)
- Make sure email address is typed correctly

### Check 4: Gmail Settings
- Add `noreply@emailjs.com` to contacts
- Check Gmail filters

## 🎯 **99% Fix: Template "To" Field**

The issue is almost always that the **"To"** field in your EmailJS template is:
- Empty ❌
- Hardcoded email ❌  
- Wrong variable name ❌

It should be: `{{to_email}}` ✅

## 🚀 **Test Right Now:**

1. Fix the "To" field: `{{to_email}}`
2. Save template
3. Register new user in your app
4. Check email (and spam folder)

This should fix 99% of email delivery issues! 🎯