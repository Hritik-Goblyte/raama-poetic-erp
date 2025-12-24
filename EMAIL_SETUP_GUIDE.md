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
3. Use this template content:

```html
Subject: Verify your email for रामा..!

Hello {{user_name}},

Welcome to रामा..! - The Poetic ERP Platform.

Please verify your email address by clicking the link below:

{{verification_link}}

If the button doesn't work, copy and paste this link in your browser:
{{verification_link}}

This link will expire in 24 hours.

Best regards,
The रामा Team
{{from_email}}
```

4. Save the template and note down your **Template ID**

### Step 4: Get Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. Copy it for later use

### Step 5: Configure Backend Environment

Update your `backend/.env` file:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID="your_service_id_here"
EMAILJS_TEMPLATE_ID="your_template_id_here"
EMAILJS_PUBLIC_KEY="your_public_key_here"

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

## 📧 How Email Verification Works

1. **Registration**: User registers → Email verification set to `false` → Verification email sent
2. **Login Attempt**: If email not verified → Show error message with resend option
3. **Email Click**: User clicks verification link → Email verified → Can login normally
4. **Resend**: User can request new verification email if needed

## 🎯 Email Template Variables

The system uses these variables in email templates:

- `{{user_name}}` - User's first name
- `{{verification_link}}` - Complete verification URL
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