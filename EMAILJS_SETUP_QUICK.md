# 🚀 Quick EmailJS Setup for रामा

## Step 1: Copy Template
1. Open `EMAILJS_TEMPLATE.html` (for beautiful design) or `EMAILJS_TEMPLATE_SIMPLE.txt` (for simple)
2. Copy the entire content

## Step 2: Create EmailJS Template
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Paste the copied content
5. Save and note the **Template ID**

## Step 3: Get Keys
1. **Service ID**: Email Services → Your service → Copy ID
2. **Template ID**: From step 2 above
3. **Public Key**: Account → General → Public Key
4. **Private Key**: Account → API Keys → Create/Copy Private Key

## Step 4: Update .env
```env
EMAILJS_SERVICE_ID="service_xxxxxxx"
EMAILJS_TEMPLATE_ID="template_xxxxxxx"  
EMAILJS_PUBLIC_KEY="your_public_key"
EMAILJS_PRIVATE_KEY="your_private_key"
```

## Step 5: Test
1. Register a new user
2. Check email for OTP
3. If no email, check backend logs for: `🔐 OTP for email: 123456`

## 🎯 Template Variables Used:
- `{{user_name}}` → User's first name
- `{{otp_code}}` → 6-digit OTP  
- `{{expiry_time}}` → "10 minutes"
- `{{from_name}}` → "रामा Team"
- `{{from_email}}` → Your email

## ✅ Ready!
Your email verification system is now complete! 🎉