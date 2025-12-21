#!/bin/bash

# Production startup script for रामा - The Poetic ERP
# Make sure to update environment variables before running

echo "🚀 Starting रामा Production Deployment..."

# Check if MongoDB is accessible
echo "📊 Checking MongoDB connection..."
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  MongoDB shell not found. Make sure MongoDB is accessible."
fi

# Backend setup
echo "🔧 Setting up Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements_clean.txt

# Check environment variables
if [ ! -f ".env" ]; then
    echo "❌ Backend .env file not found!"
    echo "Please create backend/.env with production values"
    echo "See DEPLOYMENT_GUIDE.md for details"
    exit 1
fi

# Start backend
echo "🚀 Starting Backend Server..."
uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

cd ..

# Frontend setup
echo "🎨 Setting up Frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    yarn install
fi

# Check environment variables
if [ ! -f ".env" ]; then
    echo "❌ Frontend .env file not found!"
    echo "Please create frontend/.env with production values"
    kill $BACKEND_PID
    exit 1
fi

# Build frontend
echo "🏗️  Building Frontend..."
yarn build

# Serve frontend (for testing - use proper web server in production)
echo "🌐 Starting Frontend Server..."
npx serve -s build -l 3000 &
FRONTEND_PID=$!

cd ..

# Admin setup
echo "👑 Setting up Admin Panel..."
cd admin

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Admin dependencies..."
    npm install
fi

# Check environment variables
if [ ! -f ".env" ]; then
    echo "❌ Admin .env file not found!"
    echo "Please create admin/.env with production values"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

# Build admin
echo "🏗️  Building Admin Panel..."
npm run build

# Serve admin (for testing - use proper web server in production)
echo "🌐 Starting Admin Panel..."
npx serve -s build -l 3001 &
ADMIN_PID=$!

cd ..

echo "✅ All services started successfully!"
echo ""
echo "🌐 Services running on:"
echo "   Backend:  http://localhost:8001"
echo "   Frontend: http://localhost:3000"
echo "   Admin:    http://localhost:3001"
echo ""
echo "📚 API Documentation: http://localhost:8001/docs"
echo ""
echo "⚠️  Note: This script is for testing. Use proper web servers (Nginx, Apache) in production."
echo ""
echo "To stop all services, run: kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID"

# Keep script running
wait