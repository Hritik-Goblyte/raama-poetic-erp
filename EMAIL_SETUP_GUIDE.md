# Email Verification Setup Guide

This guide will help you set up email verification for the Raama Poetry Platform using EmailJS.

## 🚀 Quick Setup with EmailJS (Recommended)

EmailJS allows you to send emails directly from the frontend or backend without setting up your own email server.

### Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### Step 3: Create Email Template

1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. **Choose Template Type:**

#### Option A: HTML Template (Recommended - Beautiful Design)
- Copy the content from `EMAILJS_TEMPLATE.html` file
- This creates a beautiful, branded email with रामा styling

#### Option B: Simple Text Template (Fallback)
- Copy the content from `EMAILJS_TEMPLATE_SIMPLE.txt` file  
- This creates a simple text-based email

#### Template Variables (Required):
Make sure your template includes these variables:
- `{{user_name}}` - User's first name
- `{{otp_code}}` - 6-digit verification code
- `{{expiry_time}}` - "10 minutes"
- `{{from_name}}` - "रामा Team"
- `{{from_email}}` - Your configured from email

4. **Test the Template:**
   - Use EmailJS template tester
   - Send a test email to yourself
   - Verify all variables are working

5. Save the template and note down your **Template ID**

### Step 4: Get Public and Private Keys

1. Go to **Account** → **General**
2. Find your **Public Key** and copy it
3. Go to **Account** → **API Keys**
4. Create a new **Private Key** or use existing one
5. Copy both keys for configuration

**Important:** Private key is required for server-side API calls!

### Step 5: Configure Backend Environment

Update your `backend/.env` file:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID="your_service_id_here"
EMAILJS_TEMPLATE_ID="your_template_id_here"
EMAILJS_PUBLIC_KEY="your_public_key_here"
EMAILJS_PRIVATE_KEY="your_private_key_here"

# Email Settings
FROM_EMAIL="noreply@yourdomain.com"
FRONTEND_URL="http://localhost:3000"
```

### Step 6: Test Email Configuration

1. Start your backend server
2. Test the email configuration:

```bash
curl -X POST "http://localhost:8001/api/auth/test-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

## 🔧 Alternative: SMTP Setup

If you prefer traditional SMTP, update your `.env` file:

```env
# SMTP Configuration
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"
FRONTEND_URL="http://localhost:3000"
```

**Note:** For Gmail, you'll need to use an App Password instead of your regular password.

## 📧 Email Templates Provided

This project includes two ready-to-use EmailJS templates:

### 1. **EMAILJS_TEMPLATE.html** (Recommended)
- **Beautiful HTML design** with रामा branding
- **Dark theme** matching the app design
- **Glassmorphism effects** and orange accent colors
- **Responsive design** for all devices
- **Professional layout** with security notices

### 2. **EMAILJS_TEMPLATE_SIMPLE.txt** (Fallback)
- **Simple text format** for maximum compatibility
- **All essential information** included
- **Works with any email client**
- **Lightweight and fast**

### Template Features:
- ✅ **Branded Design** - Matches रामा app theme
- ✅ **Security Notices** - Warns users about code safety
- ✅ **Clear Instructions** - Step-by-step verification guide
- ✅ **Professional Footer** - Contact information and branding
- ✅ **Responsive Layout** - Works on mobile and desktop
- ✅ **Hindi/English Mix** - Cultural authenticity

## 📧 How Email Verification Works (OTP System)

1. **Registration**: User registers → Email verification set to `false` → 6-digit OTP generated → OTP email sent
2. **OTP Entry**: User enters OTP on verification page → OTP validated → Email verified → Auto login
3. **OTP Expiry**: OTP expires in 10 minutes → User can request new OTP
4. **Login Attempt**: If email not verified → Show error message with verification option

## 🎯 Email Template Variables (OTP System)

The system uses these variables in email templates:

- `{{user_name}}` - User's first name
- `{{otp_code}}` - 6-digit verification code
- `{{expiry_time}}` - "10 minutes"
- `{{from_name}}` - "रामा Team"
- `{{from_email}}` - Your configured from email

## 🔒 Security Features

- **Secure Tokens**: 32-character URL-safe tokens
- **Token Expiry**: Links expire after 24 hours
- **One-time Use**: Tokens are removed after successful verification
- **Password Required**: Resend requires valid password

## 🚨 Troubleshooting

### Email Not Sending
1. Check EmailJS service status
2. Verify all environment variables are set
3. Check EmailJS dashboard for error logs
4. Test with the `/api/auth/test-email` endpoint

### Verification Link Not Working
1. Check if `FRONTEND_URL` is correct
2. Ensure the token hasn't expired
3. Verify the email template has `{{verification_link}}`

### Users Can't Login
1. Check if email verification is enabled in login endpoint
2. Verify database has `emailVerified: false` for new users
3. Check if verification email was sent successfully

## 📱 Production Deployment

For production, update these settings:

```env
FRONTEND_URL="https://yourdomain.com"
FROM_EMAIL="noreply@yourdomain.com"
```

Make sure your EmailJS account can handle your expected email volume.

## 💡 Tips

- **Free Tier**: EmailJS free tier includes 200 emails/month
- **Custom Domain**: Use your own domain for professional emails
- **Monitoring**: Check EmailJS dashboard for delivery statistics
- **Backup**: Consider implementing SMTP fallback for critical emails

---

**Need Help?** Check the EmailJS documentation or contact support for advanced configurations.