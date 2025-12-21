Write-Host "Fixing backend dependencies..." -ForegroundColor Green
Set-Location backend

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "..\venv\Scripts\Activate.ps1"

Write-Host "Reinstalling pydantic and pydantic-core..." -ForegroundColor Yellow
pip uninstall pydantic pydantic-core -y
pip install pydantic==2.12.5 pydantic-core==2.41.5

Write-Host "Checking if google-generativeai is still installed..." -ForegroundColor Yellow
pip show google-generativeai

Write-Host ""
Write-Host "Dependencies fixed!" -ForegroundColor Green
Write-Host "Try starting the backend server again with:" -ForegroundColor Yellow
Write-Host "uvicorn server:app --reload --port 8001" -ForegroundColor Cyan
Read-Host "Press Enter to continue"