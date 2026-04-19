# FinCollect Local Web Server for PowerShell
# Run this script to start development server

# Color output helper
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "╔════════════════════════════════════════════════════════════╗" "Cyan"
Write-Color "║     FinCollect Local Development Web Server               ║" "Cyan"
Write-Color "╚════════════════════════════════════════════════════════════╝" "Cyan"
Write-Color ""

# Check Python
Write-Color "[*] Checking Python installation..." "Yellow"
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Color "[✗] Error: Python not found!" "Red"
    Write-Color "Please install Python from: https://www.python.org/downloads/" "Red"
    Write-Color "Make sure to check 'Add Python to PATH' during installation" "Red"
    Read-Host "Press Enter to continue"
    exit 1
}
Write-Color "[✓] $pythonVersion" "Green"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $scriptDir

Write-Color ""
Write-Color "════════════════════════════════════════════════════════════" "Cyan"
Write-Color "✓ Starting server on http://localhost:8000" "Green"
Write-Color "════════════════════════════════════════════════════════════" "Cyan"
Write-Color ""

Write-Color "Features enabled:" "Yellow"
Write-Color "  • CORS bypassed for local development" "White"
Write-Color "  • All library loading enabled" "White"
Write-Color "  • Font files accessible" "White"
Write-Color "  • Service Worker compatible" "White"
Write-Color ""

Write-Color "Opening browser in 2 seconds..." "Yellow"
Start-Sleep -Seconds 2

# Try to open browser
try {
    Start-Process "http://localhost:8000"
} catch {
    Write-Color "Note: Manual browser open failed. Open: http://localhost:8000" "Yellow"
}

Write-Color ""
Write-Color "Press Ctrl+C to stop the server" "Yellow"
Write-Color ""

# Start server
python -m http.server 8000 --directory $scriptDir
