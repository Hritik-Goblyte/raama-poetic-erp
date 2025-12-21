# 🛡️ Raama Admin Dashboard Setup Guide

Complete guide to set up and run the secure admin dashboard for the Raama Poetry Platform.

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.11+ installed
- MongoDB running on localhost:27017
- Backend server running on port 8001

## 🚀 Quick Start

### 1. Create Admin User
```bash
cd scripts
python create_admin.py
```

### 2. Start Admin Dashboard

**Option A: Using npm**
```bash
cd admin
npm install
npm start
```

**Option B: Using batch file (Windows)**
```cmd
cd admin
start-admin.bat
```

**Option C: Using PowerShell (Windows)**
```powershell
cd admin
.\start-admin.ps1
```

### 3. Access Admin Panel
- URL: `http://localhost:3001`
- Email: `admin@raama.com`
- Password: `admin123`
- Admin Secret: `raama-admin-2024`

## 🔧 Detailed Setup

### Step 1: Backend Preparation
Ensure your backend server is running with admin endpoints:
```bash
cd backend
python server.py
```

### Step 2: Create Admin User
```bash
cd scripts
python create_admin.py
```
This creates an admin user in your MongoDB database.

### Step 3: Install Admin Dependencies
```bash
cd admin
npm install
```

### Step 4: Configure Environment
Create `admin/.env`:
```env
PORT=3001
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_ADMIN_SECRET=raama-admin-2024
```

### Step 5: Start Admin Dashboard
```bash
npm start
```

## 🎯 Admin Dashboard Features

### 🏠 Overview Tab
- **Platform Statistics**: Total users, writers, readers, shayaris
- **Pending Alerts**: Writer requests awaiting approval
- **Quick Actions**: Direct navigation to pending tasks

### ✍️ Writers Management
- View all writers with profiles
- See join dates and activity
- Monitor content creation

### 👥 Readers Management
- Browse all reader accounts
- Track user engagement
- Manage user roles

### 📝 Shayaris Management
- View all published content
- Content moderation tools
- Delete inappropriate shayaris
- Author attribution tracking

### ⏳ Writer Requests
- **Approve/Reject**: User upgrade requests
- **Batch Processing**: Handle multiple requests
- **History Tracking**: See processed requests
- **Notifications**: Auto-notify users of decisions

## 🔐 Security Features

### Multi-Layer Authentication
1. **Email/Password**: Standard user authentication
2. **Admin Role Check**: Only admin users can access
3. **Admin Secret Key**: Additional security layer
4. **Separate Port**: Isolated from main application

### Security Best Practices
- Change default admin secret in production
- Use strong passwords for admin accounts
- Run behind firewall/VPN in production
- Monitor access logs regularly
- Keep dependencies updated

## 🎨 UI/UX Features

### Modern Design
- **Dark Theme**: Professional appearance
- **Glass Morphism**: Modern card designs
- **Responsive Layout**: Works on all devices
- **Intuitive Navigation**: Tab-based interface

### Interactive Elements
- **Real-time Updates**: Live data refresh
- **Status Indicators**: Visual feedback
- **Confirmation Dialogs**: Prevent accidental actions
- **Toast Notifications**: User feedback

## 📊 Admin Actions

### User Management
```javascript
// Approve writer request
POST /api/writer-requests/{id}/approve

// Reject writer request  
PUT /api/writer-requests/{id}/reject

// Get all users by role
GET /api/users/writers
GET /api/users/readers
```

### Content Management
```javascript
// Delete shayari
DELETE /api/shayaris/{id}

// Get all shayaris
GET /api/shayaris

// Get platform stats
GET /api/admin/stats
```

## 🚨 Production Deployment

### Environment Configuration
```env
PORT=3001
REACT_APP_BACKEND_URL=https://api.raama.com
REACT_APP_ADMIN_SECRET=your-super-secure-secret-2024
```

### Build for Production
```bash
npm run build
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name admin.raama.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Monitoring & Logs

### Access Monitoring
- All admin actions are logged
- Failed login attempts tracked
- User activity monitoring
- Content moderation logs

### Health Checks
- Database connectivity
- API endpoint status
- User session validation
- Performance metrics

## 🛠️ Troubleshooting

### Common Issues

**Admin can't login:**
- Verify admin user exists in database
- Check admin role is set correctly
- Confirm admin secret matches

**Dashboard not loading:**
- Ensure backend is running on port 8001
- Check MongoDB connection
- Verify environment variables

**Permission errors:**
- Confirm user has admin role
- Check JWT token validity
- Verify API endpoints are accessible

### Debug Commands
```bash
# Check admin user exists
mongo test_database --eval "db.users.findOne({role: 'admin'})"

# Verify backend is running
curl http://localhost:8001/api/stats

# Test admin endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8001/api/admin/stats
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all prerequisites are met
3. Review error logs in browser console
4. Ensure all services are running

---

**⚠️ Security Warning**: This admin dashboard provides full control over the platform. Protect access credentials and monitor usage carefully.