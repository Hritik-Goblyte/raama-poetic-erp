#!/bin/bash

echo "🚀 Starting Raama Admin Dashboard..."
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOL
PORT=3001
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_ADMIN_SECRET=raama-admin-2024
EOL
    echo "✅ .env file created"
fi

echo ""
echo "🔐 Admin Dashboard Security Info:"
echo "   Port: 3001"
echo "   URL: http://localhost:3001"
echo "   Secret Key: raama-admin-2024"
echo ""
echo "👤 Default Admin Credentials:"
echo "   Email: admin@raama.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Remember to:"
echo "   1. Create admin user with: python ../scripts/create_admin.py"
echo "   2. Change default password after first login"
echo "   3. Update admin secret in production"
echo ""

# Start the admin dashboard
npm start