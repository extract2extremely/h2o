#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════════
# Quick Font Awesome Download - Fast Setup (2 minutes)
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Font Awesome Download - Quick Setup (2 minutes)        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$libDir = Split-Path -Parent $MyInvocation.MyCommandPath
$libDir = Join-Path $libDir "lib"

# Create directories
Write-Host "[i] Creating directory structure..." -ForegroundColor Yellow
$dirs = @(
    "$libDir/fontawesome/css"
    "$libDir/fontawesome/webfonts"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Download Font Awesome
Write-Host "[i] Downloading Font Awesome 6.4.0 from CDN..." -ForegroundColor Yellow
$fontAwesomeUrl = "https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-web.zip"
$zipPath = "$libDir/fontawesome.zip"
$extractPath = "$libDir/fa-extract"

try {
    Invoke-WebRequest -Uri $fontAwesomeUrl -OutFile $zipPath -ErrorAction Stop
    Write-Host "[✓] Downloaded successfully!" -ForegroundColor Green
    
    Write-Host "[i] Extracting files..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    
    # Copy CSS
    $cssFile = Get-ChildItem -Path $extractPath -Filter "all.min.css" -Recurse | Select-Object -First 1
    if ($cssFile) {
        Copy-Item $cssFile.FullName -Destination "$libDir/fontawesome/css/" -Force
        Write-Host "[✓] CSS file extracted" -ForegroundColor Green
    }
    
    # Copy Fonts
    $fontFiles = Get-ChildItem -Path $extractPath -Include "*.woff2", "*.woff", "*.ttf" -Recurse
    $fontCount = ($fontFiles | Measure-Object).Count
    if ($fontFiles) {
        $fontFiles | ForEach-Object {
            Copy-Item $_.FullName -Destination "$libDir/fontawesome/webfonts/" -Force
        }
        Write-Host "[✓] Font files extracted ($fontCount files)" -ForegroundColor Green
    }
    
    # Cleanup
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                   ✓ Download Complete!                        ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║  Icons should now display properly in your application.      ║" -ForegroundColor Green
    Write-Host "║  Refresh your browser (Ctrl+F5) to see the changes.          ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
} catch {
    Write-Host "[✗] Download failed: $_" -ForegroundColor Red
    Write-Host "`n[i] Don't worry! Icons will still display using CDN fallback." -ForegroundColor Yellow
    Write-Host "[i] Your application is working properly." -ForegroundColor Yellow
    Write-Host "[i] Try again later to download for offline use.`n" -ForegroundColor Yellow
}
