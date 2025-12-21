# Email Troubleshooting Guide 📧

## Current Issue: Not Receiving Emails

### Quick Fix Checklist ✅

1. **Check .env Configuration**
   ```bash
   # Your backend/.env should have:
   SMTP_USERNAME="raama.info@gmail.com"
   SMTP_PASSWORD="jvwm cnoc mvpy jnzq"  # App password, not regular password
   FROM_EMAIL="raama.info@gmail.com"
   ```

2. **Test Email Configuration**
   ```bash
   cd backend
   python test_email.py
   ```

3. **Check Server Logs**
   - Look for email-related errors in your FastAPI server logs
   - The improved logging will show detailed SMTP connection info

### Common Issues & Solutions

#### 1. **Gmail Authentication Error**
**Error**: `SMTPAuthenticationError: Username and Password not accepted`

**Solutions**:
- ✅ Enable 2-Factor Authentication on Gmail
- ✅ Generate App Password (not regular password)
- ✅ Use App Password in `SMTP_PASSWORD`

**Steps to Generate Gmail App Password**:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and generate password
5. Use the 16-character password in your .env

#### 2. **Connection Timeout**
**Error**: `SMTPConnectError` or timeout errors

**Solutions**:
- Check firewall settings
- Try different SMTP servers:
  ```bash
  # Gmail
  SMTP_SERVER="smtp.gmail.com"
  SMTP_PORT="587"
  
  # Outlook/Hotmail
  SMTP_SERVER="smtp-mail.outlook.com"
  SMTP_PORT="587"
  ```

#### 3. **Emails Going to Spam**
**Issue**: Emails sent but not in inbox

**Solutions**:
- Check spam/junk folder
- Use your own domain email
- Add SPF/DKIM records (for production)

#### 4. **Development Mode (No Email)**
If you want to test without email, the system works gracefully:
- Registration still works
- Users get success message
- Manual verification via database

### Testing Steps

#### Step 1: Test Email Configuration
```bash
cd backend
python test_email.py
```

#### Step 2: Test Registration Flow
1. Register a new user
2. Check server logs for email sending status
3. Check email inbox (including spam)

#### Step 3: Manual Verification (if needed)
If emails aren't working, you can manually verify users:

```python
# Connect to MongoDB and update user
db.users.update_one(
    {"email": "user@example.com"},
    {"$set": {"emailVerified": True}, "$unset": {"emailVerificationToken": ""}}
)
```

### Alternative Email Providers

#### Option 1: Gmail (Current Setup)
```bash
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

#### Option 2: Outlook/Hotmail
```bash
SMTP_SERVER="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@outlook.com"
SMTP_PASSWORD="your-password"
```

#### Option 3: SendGrid (Production Recommended)
```bash
SMTP_SERVER="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USERNAME="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### Debug API Endpoint

Test email directly via API:
```bash
curl -X POST "http://localhost:8000/api/auth/test-email?email=your-email@gmail.com"
```

### Current Configuration Status

Based on your .env file:
- ✅ SMTP_SERVER: smtp.gmail.com
- ✅ SMTP_PORT: 587
- ✅ SMTP_USERNAME: raama.info@gmail.com
- ✅ SMTP_PASSWORD: Set (app password)
- ✅ FROM_EMAIL: raama.info@gmail.com

**Next Steps**:
1. Run the test script: `python backend/test_email.py`
2. Check if the Gmail account has 2FA enabled
3. Verify the app password is correct
4. Check server logs for detailed error messages

### Production Recommendations

For production deployment:
1. **Use SendGrid or AWS SES** for reliable email delivery
2. **Set up SPF/DKIM records** for your domain
3. **Use environment-specific configs** for different environments
4. **Monitor email delivery rates** and bounces

### Fallback Options

If email continues to fail:
1. **Disable email verification temporarily**:
   ```python
   # In registration endpoint, set emailVerified=True by default
   emailVerified=True
   ```

2. **Use SMS verification** as alternative
3. **Manual admin approval** process
4. **Social login integration** (Google/Facebook OAuth)

### Support

If you're still having issues:
1. Check the server logs for detailed error messages
2. Run the test script and share the output
3. Verify your Gmail account settings
4. Consider using a different email provider temporarily