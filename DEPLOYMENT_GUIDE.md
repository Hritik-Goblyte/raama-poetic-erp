# रामा - Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Issues Fixed
- ✅ Fixed missing `AsyncOpenAI` import in backend
- ✅ Fixed duplicate logger definition
- ✅ Removed debug console.log statements from frontend
- ✅ Cleaned up unused dependencies
- ✅ Removed unnecessary `.emergent` folder
- ✅ All functions are complete and implemented

### 🔧 Required Changes Before Deployment

#### 1. Environment Variables (CRITICAL)

**Backend (.env)**
```env
# Production MongoDB URL (CHANGE THIS!)
MONGO_URL="mongodb://your-production-mongodb-url:27017"
DB_NAME="raama_production"

# CORS Origins (CHANGE THIS!)
CORS_ORIGINS="https://your-frontend-domain.com,https://your-admin-domain.com"

# JWT Secret (CHANGE THIS!)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"

# Email Configuration (Optional but recommended)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"
FRONTEND_URL="https://your-frontend-domain.com"

# AI Configuration (Optional)
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-3.5-turbo"
```

**Frontend (.env)**
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

**Admin (.env)**
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

#### 2. Security Updates

**CRITICAL: Change these in production:**
- JWT_SECRET: Use a strong random string (min 32 characters)
- MongoDB credentials: Use strong passwords
- Remove or secure email credentials
- Update CORS_ORIGINS to only allow your domains

#### 3. Database Setup

**MongoDB Atlas (Recommended for production):**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create database user with password
4. Whitelist your server IP or use 0.0.0.0/0 (less secure)
5. Get connection string and update MONGO_URL

**Local MongoDB:**
- Ensure MongoDB is running and accessible
- Configure proper authentication
- Set up regular backups

## Deployment Options

### Option 1: Deploy to Render (Recommended for beginners)

#### Backend Deployment
1. Create account on https://render.com
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `cd backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3.11
5. Add environment variables from backend .env
6. Deploy!

#### Frontend Deployment
1. Create new "Static Site" on Render
2. Configure:
   - **Build Command:** `cd frontend && yarn install && yarn build`
   - **Publish Directory:** `frontend/build`
3. Add environment variables
4. Deploy!

#### Admin Deployment
1. Create new "Static Site" on Render
2. Configure:
   - **Build Command:** `cd admin && npm install && npm run build`
   - **Publish Directory:** `admin/build`
3. Add environment variables
4. Deploy!

### Option 2: Deploy to Vercel (Frontend/Admin) + Railway (Backend)

#### Backend on Railway
1. Create account on https://railway.app
2. Create new project
3. Add "Python" service
4. Connect GitHub repo
5. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy!

#### Frontend on Vercel
1. Create account on https://vercel.com
2. Import GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn build`
   - **Output Directory:** `build`
4. Add environment variables
5. Deploy!

#### Admin on Vercel
1. Create new project on Vercel
2. Import same GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `admin`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Add environment variables
5. Deploy!

### Option 3: Deploy to AWS (Advanced)

#### Backend (EC2 + Elastic Beanstalk)
1. Create EC2 instance (Ubuntu 22.04)
2. Install Python 3.11, pip, and dependencies
3. Clone repository
4. Install requirements: `pip install -r backend/requirements.txt`
5. Set up Nginx as reverse proxy
6. Use PM2 or systemd to run uvicorn
7. Configure SSL with Let's Encrypt

#### Frontend & Admin (S3 + CloudFront)
1. Build applications locally
2. Upload build folders to S3 buckets
3. Configure S3 for static website hosting
4. Create CloudFront distributions
5. Configure custom domains
6. Set up SSL certificates

### Option 4: Deploy to DigitalOcean (Balanced)

#### Using App Platform
1. Create account on https://www.digitalocean.com
2. Create new App
3. Connect GitHub repository
4. Add three components:
   - **Backend:** Python service
   - **Frontend:** Static site
   - **Admin:** Static site
5. Configure build and run commands
6. Add environment variables
7. Deploy!

#### Using Droplets (Manual)
1. Create Ubuntu 22.04 droplet
2. Install Node.js, Python, MongoDB
3. Clone repository
4. Set up Nginx
5. Configure PM2 for process management
6. Set up SSL with Let's Encrypt

### Option 5: Deploy to Heroku

#### Backend
1. Create Heroku account
2. Install Heroku CLI
3. Create new app: `heroku create raama-backend`
4. Add Python buildpack
5. Set environment variables: `heroku config:set KEY=VALUE`
6. Deploy: `git subtree push --prefix backend heroku main`

#### Frontend & Admin
1. Create separate Heroku apps
2. Add Node.js buildpack
3. Deploy using git subtree

## Post-Deployment Steps

### 1. Database Seeding
```bash
# SSH into your backend server
cd backend
python ../scripts/seed_db.py
```

### 2. Create Admin User
Use the admin creation endpoint or seed script to create your first admin user.

### 3. Test All Features
- ✅ User registration and login
- ✅ Email verification (if configured)
- ✅ Shayari creation and deletion
- ✅ Admin panel access
- ✅ Writer requests
- ✅ Notifications
- ✅ Profile updates
- ✅ Bookmarks
- ✅ Follow/unfollow

### 4. Set Up Monitoring
- Configure error tracking (Sentry, Rollbar)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Enable application logs
- Set up database backups

### 5. Performance Optimization
- Enable CDN for static assets
- Configure caching headers
- Optimize images
- Enable gzip compression
- Set up database indexes

## Production Checklist

### Security
- [ ] Changed JWT_SECRET to strong random string
- [ ] Updated CORS_ORIGINS to specific domains
- [ ] Secured MongoDB with authentication
- [ ] Removed sensitive data from .env files in repo
- [ ] Set up HTTPS/SSL certificates
- [ ] Configured rate limiting
- [ ] Set up firewall rules

### Performance
- [ ] Enabled database indexes
- [ ] Configured CDN
- [ ] Optimized images
- [ ] Enabled caching
- [ ] Set up load balancing (if needed)

### Monitoring
- [ ] Set up error tracking
- [ ] Configured uptime monitoring
- [ ] Enabled application logs
- [ ] Set up database backups
- [ ] Configured alerts

### Documentation
- [ ] Updated README with production URLs
- [ ] Documented API endpoints
- [ ] Created user guide
- [ ] Documented admin procedures

## Troubleshooting

### Backend Issues
- **500 Error:** Check logs for Python errors
- **Database Connection:** Verify MONGO_URL and network access
- **CORS Errors:** Update CORS_ORIGINS in backend .env
- **Email Not Sending:** Check SMTP credentials

### Frontend Issues
- **API Errors:** Verify REACT_APP_API_URL
- **Build Failures:** Check Node.js version (18+)
- **Blank Page:** Check browser console for errors

### Common Issues
- **MongoDB Connection Timeout:** Whitelist server IP in MongoDB Atlas
- **JWT Token Expired:** Users need to log in again
- **Email Verification Not Working:** Check SMTP configuration

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Check database backups weekly
- Update dependencies monthly
- Review security patches
- Monitor disk space and performance

### Scaling
- Add database replicas for read scaling
- Use load balancer for multiple backend instances
- Implement caching layer (Redis)
- Use CDN for static assets
- Consider microservices architecture

## Support

For issues or questions:
- Check logs first
- Review this deployment guide
- Check MongoDB connection
- Verify environment variables
- Test API endpoints directly

## Cost Estimates

### Free Tier (Development)
- Render: Free tier available
- MongoDB Atlas: Free tier (512MB)
- Vercel: Free tier for personal projects
- **Total: $0/month**

### Small Production
- Render Web Service: $7/month
- MongoDB Atlas M10: $57/month
- Vercel Pro: $20/month
- **Total: ~$84/month**

### Medium Production
- Railway: $20/month
- MongoDB Atlas M20: $115/month
- Vercel Pro: $20/month
- CDN: $10/month
- **Total: ~$165/month**

### Large Production
- AWS EC2 (t3.medium): $30/month
- MongoDB Atlas M30: $230/month
- CloudFront: $50/month
- Load Balancer: $20/month
- **Total: ~$330/month**

## Next Steps

1. Choose your deployment platform
2. Set up MongoDB database
3. Configure environment variables
4. Deploy backend first
5. Deploy frontend and admin
6. Test thoroughly
7. Set up monitoring
8. Go live! 🚀

---

**Built with ❤️ for poetry lovers**
