# GreenPastures Dairy Farm Management System Startup Script
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "     Starting GreenPastures Dairy Management System...     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start Python Flask Backend
Write-Host "Starting Flask API backend..." -ForegroundColor Yellow
$BackendProcess = Start-Process python -ArgumentList "backend/app.py" -NoNewWindow -PassThru -ErrorAction SilentlyContinue

if (-not $BackendProcess) {
    Write-Error "Failed to start Flask backend. Please make sure python is installed and in your PATH."
    Exit
}

# 2. Start React Frontend
Write-Host "Starting Vite React frontend..." -ForegroundColor Yellow
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$FrontendProcess = Start-Process "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "frontend" -NoNewWindow -PassThru -ErrorAction SilentlyContinue

if (-not $FrontendProcess) {
    Write-Error "Failed to start Vite frontend. Please make sure nodejs/npm is installed."
    # Clean up backend
    Stop-Process -Id $BackendProcess.Id -Force
    Exit
}

# 3. Launch Web Browser
Write-Host "Launching GreenPastures in your default browser..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "GreenPastures is running! Press Ctrl+C in this terminal to shut down." -ForegroundColor Green

# Wait for process termination
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nShutting down servers..." -ForegroundColor Yellow
    if ($BackendProcess) { Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($FrontendProcess) { Stop-Process -Id $FrontendProcess.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "Servers stopped. Have a great day!" -ForegroundColor Green
}
