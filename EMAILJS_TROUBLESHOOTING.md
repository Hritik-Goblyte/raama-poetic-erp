# 🔧 EmailJS Email Not Received - Troubleshooting Guide

## 🚨 Common Issue: API Success but No Email

If EmailJS shows "email sent successfully" but you don't receive emails, here are the most common causes:

## 1. 📧 **Check Email Template Variables**

### Problem: Template variables not matching
Your template might be using different variable names than what the backend sends.

### Backend sends:
```javascript
{
  "to_email": "user@example.com",
  "user_name": "John",
  "otp_code": "123456",
  "from_name": "रामा Team",
  "from_email": "raama.info@gmail.com",
  "expiry_time": "10 minutes"
}
```

### Template must use EXACTLY:
- `{{to_email}}` - Recipient email
- `{{user_name}}` - User's name
- `{{otp_code}}` - OTP code
- `{{from_name}}` - Sender name
- `{{from_email}}` - Sender email
- `{{expiry_time}}` - Expiry time

## 2. 🎯 **Fix Template "To" Field**

### Most Common Issue: Missing recipient
In your EmailJS template settings:

1. Go to **Email Templates** → Your Template
2. Check the **"To"** field
3. It should be: `{{to_email}}`
4. NOT hardcoded email address

## 3. 📨 **Check Email Service Configuration**

### Gmail Service Issues:
1. **App Password**: Use Gmail App Password, not regular password
2. **2FA Required**: Enable 2-factor authentication first
3. **Less Secure Apps**: Might be disabled

### Other Services:
- **Outlook**: Check SMTP settings
- **Custom SMTP**: Verify server details

## 4. 🔍 **Check Spam/Junk Folder**

- Check spam folder in Gmail/Outlook
- Check "Promotions" tab in Gmail
- Check "Updates" tab in Gmail
- Add sender to contacts

## 5. 🛠️ **Test with EmailJS Dashboard**

1. Go to EmailJS Dashboard
2. Navigate to your template
3. Click **"Test"** button
4. Fill in test values:
   - `to_email`: your-email@gmail.com
   - `user_name`: Test User
   - `otp_code`: 123456
   - etc.
5. Send test email

## 6. 📋 **Verify Template Content**

Make sure your template has:
- **Subject line** with variables
- **Body content** with all variables
- **Proper HTML structure** (if using HTML)

## 7. 🔧 **Quick Fix Template**

Use this minimal working template:

```
Subject: रामा OTP: {{otp_code}}

Hello {{user_name}},

Your रामा verification code: {{otp_code}}

Valid for {{expiry_time}}.

Team {{from_name}}
```

## 8. 📊 **Check EmailJS Logs**

1. Go to EmailJS Dashboard
2. Check **"History"** section
3. Look for error messages
4. Check delivery status

## 9. 🚀 **Alternative: Use Console Logs**

For testing, check your backend console logs:
```
🔐 OTP for user@example.com: 123456 (Valid for 10 minutes)
```

Use this OTP to test the verification system while fixing email delivery.

## 10. 💡 **Common Solutions**

### Solution A: Update Template Variables
```html
To: {{to_email}}
Subject: Your रामा OTP: {{otp_code}}

Hello {{user_name}},
Your code: {{otp_code}}
Expires: {{expiry_time}}
```

### Solution B: Check Service Status
- Verify EmailJS service is active
- Check if email service (Gmail) is working
- Test with different email address

### Solution C: Recreate Template
1. Delete current template
2. Create new one with exact variable names
3. Test immediately

## 🎯 **Most Likely Fix**

The issue is usually in the template **"To"** field. Make sure it's set to `{{to_email}}` and not a hardcoded email address.