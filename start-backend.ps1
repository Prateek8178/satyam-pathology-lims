# LIMS Backend Server Start Script
# Run this script to start the Node.js backend server on port 5000
Set-Location "$PSScriptRoot\server"
Write-Host "Starting LIMS Backend Server..." -ForegroundColor Cyan
node src/index.js
