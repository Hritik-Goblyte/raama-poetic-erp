# रामा Admin Dashboard

Secure administrative interface for the Raama Poetry Platform.

## 🔐 Security Features

- **Separate Port**: Runs on port 3001 (different from main app)
- **Admin Secret Key**: Additional layer of security beyond login
- **Role-based Access**: Only users with 'admin' role can access
- **Secure Authentication**: JWT-based with admin verification

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd admin
npm install
```

### 2. Environment Configuration
Create `.env` file with:
```
PORT=3001
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_ADMIN_SECRET=raama-admin-2024
```

### 3. Start Admin Dashboard
```bash
npm start
```

The admin dashboard will be available at: `http://localhost:3001`

## 👤 Admin Account Setup

### Create Admin User in Database
You need to manually create an admin user in MongoDB:

```javascript
// Connect to MongoDB and run this in the users collection
{
  "id": "admin-uuid-here",
  "email": "admin@raama.com",
  "password": "$2b$12$hashed_password_here", // Use bcrypt to hash
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Login Credentials
- **Email**: admin@raama.com
- **Password**: [your chosen password]
- **Admin Secret**: raama-admin-2024

## 📊 Dashboard Features

### Overview Tab
- Platform statistics
- User counts (total, writers, readers)
- Content metrics
- Pending requests alerts

### Writers Management
- View all writers
- Writer profiles and join dates
- Content creation statistics

### Readers Management
- View all readers
- Reader profiles and activity
- Account management

### Shayaris Management
- View all published shayaris
- Content moderation
- Delete inappropriate content
- Author information

### Writer Requests
- Approve/reject writer applications
- User upgrade management
- Request history and timestamps

## 🛡️ Security Best Practices

1. **Change Default Secret**: Update `REACT_APP_ADMIN_SECRET` in production
2. **Strong Passwords**: Use complex passwords for admin accounts
3. **Network Security**: Run behind firewall/VPN in production
4. **Regular Updates**: Keep dependencies updated
5. **Access Logging**: Monitor admin access attempts

## 🔧 Production Deployment

### Environment Variables
```bash
PORT=3001
REACT_APP_BACKEND_URL=https://your-api-domain.com
REACT_APP_ADMIN_SECRET=your-super-secure-secret-key
```

### Build for Production
```bash
npm run build
```

### Serve with HTTPS
Use nginx or similar to serve with SSL:
```nginx
server {
    listen 443 ssl;
    server_name admin.raama.com;
    
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## 🚨 Important Notes

- **Never expose admin secret** in client-side code in production
- **Use environment variables** for all sensitive configuration
- **Implement IP whitelisting** for additional security
- **Regular backups** of admin access logs
- **Monitor for suspicious activity**

## 📱 Mobile Responsive

The admin dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🎨 UI Features

- **Dark Theme**: Professional dark interface
- **Glass Morphism**: Modern card designs
- **Real-time Updates**: Live data refresh
- **Intuitive Navigation**: Tab-based interface
- **Status Indicators**: Visual feedback for all actions

---

**⚠️ Security Warning**: This is an administrative interface with full platform control. Protect access credentials and monitor usage carefully.