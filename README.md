# रामा..! - The Poetic ERP

A beautiful, dark-themed poetic platform for creating and sharing Shayaris (Urdu/Hindi poetry). Built with **FastAPI**, **React**, and **MongoDB**.

## ✨ Features

### Authentication & Authorization
- **JWT-based authentication** with secure password hashing (bcrypt)
- **Role-based access control**: Reader and Writer roles
- Session management with token expiry

### Dashboard
- Personalized greeting with user name and role
- **Statistics cards**: My Creations, Username, Total Shayaris
- **Recent Shayaris** feed with author info, likes, and dates
- **Notifications panel** with read/unread states and dismiss functionality
- Floating **+ button** for quick shayari creation

### Shayari Management
- **Writers** can:
  - Create new shayaris with title and content
  - View all their shayaris
  - Delete their own shayaris
- **Readers** can:
  - View all shayaris
  - See restriction modal when attempting to create

### Additional Features
- **Writers Directory**: Browse all writers on the platform
- **Profile Page**: View personal information and statistics
- **Theme Toggle**: Switch between dark and light modes (persistent in localStorage)
- **Sidebar Navigation**: Easy access to all pages
- **Glassmorphism UI**: Modern card designs with backdrop blur
- **Poetic Fonts**: Tillana, Macondo, and Style Script for authentic feel

## 🎨 Design

- **Dark theme by default** with orange (#ff6b35) as primary accent
- **Glassmorphism cards** with subtle borders and backdrop blur
- **Elegant poetic fonts**: Tillana for headers, Style Script for content
- **Smooth transitions** and hover effects
- **Responsive design** for mobile and desktop
- **Custom scrollbar** styled in orange

## 🚀 Quick Start

### Demo Accounts

**Writer Account:**
- Email: `writer@raama.com`
- Password: `password123`

**Reader Account:**
- Email: `reader@raama.com`
- Password: `password123`

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running on localhost:27017

### Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Update with your values
python server.py
# Backend runs on http://localhost:8001
```

#### Frontend Setup
```bash
cd frontend
yarn install
cp .env.example .env  # Update with your values
yarn start
# Frontend runs on http://localhost:3000
```

#### Admin Setup
```bash
cd admin
npm install
cp .env.example .env  # Update with your values
npm start
# Admin runs on http://localhost:3001
```

#### Seed Database
```bash
cd scripts
python seed_db.py
```

This creates demo users and sample shayaris.

## 🌐 Production Deployment

**Ready for deployment!** All code issues have been fixed and the application is production-ready.

### Quick Deploy Options
- **Render:** Easy deployment with free tier
- **Vercel + Railway:** Best performance balance
- **AWS:** Maximum scalability
- **DigitalOcean:** Good middle ground

### Before Deploying
1. **Update Environment Variables** - Use production values
2. **Set up MongoDB** - Use MongoDB Atlas for production
3. **Configure Security** - Change JWT secret, enable HTTPS
4. **Choose Platform** - See deployment guide for options

📚 **See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions**

### Production Checklist
- [ ] Environment variables updated
- [ ] MongoDB Atlas configured
- [ ] JWT secret changed
- [ ] CORS origins set
- [ ] SSL certificates configured
- [ ] Monitoring set up

## 🔧 Development Scripts

### Quick Start (All Services)
```bash
# Linux/Mac
chmod +x start_production.sh
./start_production.sh

# Windows
start_production.bat
```

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # FastAPI application with all routes
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── MyShayari.js
│   │   │   ├── Writers.js
│   │   │   └── Profile.js
│   │   ├── components/
│   │   │   └── Sidebar.js
│   │   ├── App.js
│   │   ├── App.css         # Custom poetic styling
│   │   └── index.css       # Tailwind + theme config
│   ├── package.json
│   └── .env               # Frontend environment variables
└── scripts/
    └── seed_db.py         # Database seeding script
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Shayaris
- `POST /api/shayaris` - Create shayari (Writers only)
- `GET /api/shayaris` - Get all shayaris
- `GET /api/shayaris/my` - Get user's shayaris
- `DELETE /api/shayaris/:id` - Delete shayari (Author only)

### Users
- `GET /api/users/writers` - Get all writers

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Stats
- `GET /api/stats` - Get user statistics

## 🗄️ Database Schema

### Users Collection
```javascript
{
  id: "uuid",
  email: "string",
  password: "hashed_string",
  firstName: "string",
  lastName: "string",
  role: "reader" | "writer",
  createdAt: "ISO datetime"
}
```

### Shayaris Collection
```javascript
{
  id: "uuid",
  authorId: "uuid",
  authorName: "string",
  title: "string",
  content: "string",
  likes: number,
  createdAt: "ISO datetime"
}
```

### Notifications Collection
```javascript
{
  id: "uuid",
  userId: "uuid",
  message: "string",
  type: "string",
  read: boolean,
  createdAt: "ISO datetime"
}
```

## 🎯 Role-Based Access Control

| Feature | Reader | Writer |
|---------|--------|--------|
| View Shayaris | ✅ | ✅ |
| Create Shayari | ❌ | ✅ |
| Delete Own Shayari | ❌ | ✅ |
| View Writers | ✅ | ✅ |
| View Profile | ✅ | ✅ |
| Theme Toggle | ✅ | ✅ |

## 🔐 Security Features

- Passwords hashed with **bcrypt**
- **JWT tokens** with 30-day expiry
- Protected routes with Bearer authentication
- Role-based authorization on backend
- MongoDB ObjectId handling for JSON serialization
- Environment variables for sensitive data

## 🎨 UI Components

- **Shadcn UI** components (Dialog, Toast)
- **Lucide React** icons
- **date-fns** for date formatting
- **Sonner** for toast notifications
- **Custom glassmorphism** styling

## 🌟 Future Enhancements

- AI-powered Shayari generator
- Like/unlike functionality
- Follow/unfollow writers
- Search and filter shayaris
- Share shayaris on social media
- Admin panel for user management
- Email notifications
- Weekly digest

## 📝 Notes

- The app uses MongoDB with proper ObjectId exclusion for JSON responses
- Theme preference persists in localStorage
- All datetime values stored as ISO strings in MongoDB
- Responsive design optimized for 1920x800 viewport
- Custom fonts loaded from Google Fonts

## 🎭 About the Name

**रामा (Raama)** - A poetic expression in Hindi/Urdu often used in classical poetry and literature, representing elegance, beauty, and cultural richness.

---

**Built with ❤️ for poetry lovers**
