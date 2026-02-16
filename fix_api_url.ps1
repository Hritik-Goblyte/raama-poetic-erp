# PowerShell script to fix API URL issue
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing API URL Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current frontend/.env content:" -ForegroundColor Yellow
Get-Content "frontend\.env"
Write-Host ""

Write-Host "Clearing cache..." -ForegroundColor Yellow
Set-Location "frontend"

# Clear various cache directories
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Verifying .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "REACT_APP_API_URL=https://raama-backend-srrb.onrender.com" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created." -ForegroundColor Green
} else {
    Write-Host ".env file exists." -ForegroundColor Green
}

Write-Host ""
Write-Host "Content of .env:" -ForegroundColor Yellow
Get-Content ".env"

Write-Host ""
Write-Host "Starting frontend with debug info..." -ForegroundColor Green
Write-Host "Watch the browser console for debug messages!" -ForegroundColor Yellow
Write-Host ""

npm start