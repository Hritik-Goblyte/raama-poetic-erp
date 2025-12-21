Write-Host "🚀 Starting Raama Admin Dashboard..." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Set environment variables
$env:PORT = "3001"
$env:REACT_APP_BACKEND_URL = "http://localhost:8001"
$env:REACT_APP_ADMIN_SECRET = "raama-admin-2024"

Write-Host ""
Write-Host "🔐 Admin Dashboard Security Info:" -ForegroundColor Cyan
Write-Host "   Port: 3001" -ForegroundColor White
Write-Host "   URL: http://localhost:3001" -ForegroundColor White
Write-Host "   Secret Key: raama-admin-2024" -ForegroundColor White
Write-Host ""
Write-Host "👤 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@raama.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "   1. Create admin user with: python ../scripts/create_admin.py" -ForegroundColor White
Write-Host "   2. Change default password after first login" -ForegroundColor White
Write-Host "   3. Update admin secret in production" -ForegroundColor White
Write-Host ""

# Start the admin dashboard
npx react-scripts start