Write-Host "Installing Google Gemini AI package for frontend..." -ForegroundColor Green
Set-Location frontend
npm install @google/generative-ai
Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "You can now restart the frontend server." -ForegroundColor Yellow
Read-Host "Press Enter to continue"