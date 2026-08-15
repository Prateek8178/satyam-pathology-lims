# LIMS Frontend Dev Server Start Script
# Run this script to start the Vite dev server on port 5173
Set-Location "$PSScriptRoot\client"
Write-Host "Starting LIMS Frontend (Vite)..." -ForegroundColor Cyan
npx vite
