# ═══════════════════════════════════════════════════════════════════════════
# FinCollect Offline Libraries Download Script
# Automatically downloads all required libraries for offline use
# ═══════════════════════════════════════════════════════════════════════════

# Requires: Windows PowerShell 5.1+

$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

# Color output
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Error2 { Write-Host "[✗] $args" -ForegroundColor Red }
function Write-Info { Write-Host "[i] $args" -ForegroundColor Cyan }
function Write-Warning2 { Write-Host "[!] $args" -ForegroundColor Yellow }

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       FinCollect - Offline Libraries Download Script          ║" -ForegroundColor Cyan
Write-Host "║         Professional Web Development with Font Awesome        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Define base directories
$projectRoot = Split-Path -Parent $MyInvocation.MyCommandPath
$libDir = Join-Path $projectRoot "lib"

# Create directory structure
function Create-Directories {
    Write-Info "Creating directory structure..."
    
    $dirs = @(
        "$libDir/fontawesome/css"
        "$libDir/fontawesome/webfonts"
        "$libDir/chartjs"
        "$libDir/sweetalert2"
        "$libDir/jspdf"
        "$libDir/html2canvas"
        "$(Join-Path $projectRoot 'fonts')"
    )
    
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created: $dir"
        } else {
            Write-Info "Already exists: $dir"
        }
    }
}

# Download Font Awesome
function Download-FontAwesome {
    Write-Info "`nDownloading Font Awesome 6.4.0..."
    
    $fontAwesomeUrl = "https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-web.zip"
    $zipPath = "$libDir/fontawesome.zip"
    $extractPath = "$libDir/fontawesome-extract"
    
    try {
        # Download
        Write-Info "Fetching from $fontAwesomeUrl..."
        Invoke-WebRequest -Uri $fontAwesomeUrl -OutFile $zipPath -ErrorAction Stop
        Write-Success "Downloaded Font Awesome"
        
        # Extract
        Write-Info "Extracting Font Awesome..."
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        # Copy CSS
        $cssSource = Get-ChildItem -Path $extractPath -Filter "all.min.css" -Recurse | Select-Object -First 1
        if ($cssSource) {
            Copy-Item $cssSource.FullName -Destination "$libDir/fontawesome/css/" -Force
            Write-Success "Copied Font Awesome CSS"
        }
        
        # Copy Webfonts
        $webfontsSource = Get-ChildItem -Path $extractPath -Filter "*.woff*" -Recurse
        if ($webfontsSource) {
            $webfontsSource | ForEach-Object { 
                Copy-Item $_.FullName -Destination "$libDir/fontawesome/webfonts/" -Force 
            }
            Write-Success "Copied Font Awesome webfonts ($(($webfontsSource | Measure-Object).Count) files)"
        }
        
        # Cleanup
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Error2 "Failed to download Font Awesome: $_"
        Write-Warning2 "Manual download: Visit https://fontawesome.com/download"
    }
}

# Download Chart.js
function Download-ChartJS {
    Write-Info "`nDownloading Chart.js..."
    
    $chartJsUrl = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js"
    $destination = "$libDir/chartjs/chart.min.js"
    
    try {
        Write-Info "Fetching from $chartJsUrl..."
        Invoke-WebRequest -Uri $chartJsUrl -OutFile $destination -ErrorAction Stop
        Write-Success "Downloaded Chart.js"
    } catch {
        Write-Error2 "Failed to download Chart.js: $_"
        Write-Warning2 "Visit: https://www.chartjs.org/"
    }
}

# Download SweetAlert2
function Download-SweetAlert2 {
    Write-Info "`nDownloading SweetAlert2..."
    
    $urls = @{
        js = "https://cdn.jsdelivr.net/npm/sweetalert2@11.10.0/dist/sweetalert2.min.js"
        css = "https://cdn.jsdelivr.net/npm/sweetalert2@11.10.0/dist/sweetalert2.min.css"
    }
    
    try {
        Write-Info "Fetching SweetAlert2..."
        Invoke-WebRequest -Uri $urls.js -OutFile "$libDir/sweetalert2/sweetalert2.min.js" -ErrorAction Stop
        Invoke-WebRequest -Uri $urls.css -OutFile "$libDir/sweetalert2/sweetalert2.min.css" -ErrorAction Stop
        Write-Success "Downloaded SweetAlert2"
    } catch {
        Write-Error2 "Failed to download SweetAlert2: $_"
        Write-Warning2 "Visit: https://sweetalert2.github.io/"
    }
}

# Download jsPDF
function Download-jsPDF {
    Write-Info "`nDownloading jsPDF and AutoTable..."
    
    $urls = @{
        jspdf = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        autotable = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"
    }
    
    try {
        Write-Info "Fetching jsPDF..."
        Invoke-WebRequest -Uri $urls.jspdf -OutFile "$libDir/jspdf/jspdf.umd.min.js" -ErrorAction Stop
        Write-Success "Downloaded jsPDF"
        
        Write-Info "Fetching AutoTable plugin..."
        Invoke-WebRequest -Uri $urls.autotable -OutFile "$libDir/jspdf/jspdf.plugin.autotable.min.js" -ErrorAction Stop
        Write-Success "Downloaded jsPDF AutoTable"
        
    } catch {
        Write-Error2 "Failed to download jsPDF: $_"
        Write-Warning2 "Visit: https://github.com/parallax/jsPDF"
    }
}

# Download html2canvas
function Download-html2canvas {
    Write-Info "`nDownloading html2canvas..."
    
    $url = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    
    try {
        Write-Info "Fetching html2canvas..."
        Invoke-WebRequest -Uri $url -OutFile "$libDir/html2canvas/html2canvas.min.js" -ErrorAction Stop
        Write-Success "Downloaded html2canvas"
    } catch {
        Write-Error2 "Failed to download html2canvas: $_"
        Write-Warning2 "Visit: https://html2canvas.hertzen.com/"
    }
}

# Download Inter Font
function Download-InterFont {
    Write-Info "`nDownloading Inter Font..."
    
    $fontsUrl = "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip"
    $zipPath = "$libDir/inter-fonts.zip"
    $extractPath = "$libDir/inter-extract"
    
    try {
        Write-Info "Fetching Inter Font from $fontsUrl..."
        Invoke-WebRequest -Uri $fontsUrl -OutFile $zipPath -ErrorAction Stop
        Write-Success "Downloaded Inter Font"
        
        Write-Info "Extracting Inter Font..."
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        # Copy woff2 fonts
        $fontFiles = Get-ChildItem -Path $extractPath -Include "*.woff2", "*.woff" -Recurse
        if ($fontFiles) {
            $fontFiles | Where-Object { $_.Name -like "*inter*" } | ForEach-Object {
                Copy-Item $_.FullName -Destination "$(Join-Path $projectRoot 'fonts')/" -Force
            }
            Write-Success "Copied Inter font files"
        }
        
        # Cleanup
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Error2 "Failed to download Inter Font: $_"
        Write-Warning2 "Visit: https://rsms.me/inter/"
    }
}

# Verify installation
function Verify-Installation {
    Write-Info "`nVerifying installation..."
    
    $files = @{
        "Font Awesome CSS" = "$libDir/fontawesome/css/all.min.css"
        "Chart.js" = "$libDir/chartjs/chart.min.js"
        "SweetAlert2" = "$libDir/sweetalert2/sweetalert2.min.js"
        "jsPDF" = "$libDir/jspdf/jspdf.umd.min.js"
        "jsPDF AutoTable" = "$libDir/jspdf/jspdf.plugin.autotable.min.js"
        "html2canvas" = "$libDir/html2canvas/html2canvas.min.js"
    }
    
    $allGood = $true
    foreach ($name in $files.Keys) {
        if (Test-Path $files[$name]) {
            Write-Success "$name"
        } else {
            Write-Error2 "$name - MISSING"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Main execution
function Main {
    Create-Directories
    Download-FontAwesome
    Download-ChartJS
    Download-SweetAlert2
    Download-jsPDF
    Download-html2canvas
    Download-InterFont
    
    Write-Host "`n" -ForegroundColor Cyan
    if (Verify-Installation) {
        Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                   ✓ Installation Complete!                     ║" -ForegroundColor Green
        Write-Host "║                                                                ║" -ForegroundColor Green
        Write-Host "║  Your FinCollect application is now ready for offline use!     ║" -ForegroundColor Green
        Write-Host "║  All libraries have been downloaded and configured.            ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    } else {
        Write-Host "`n⚠  Some files are missing. Please review the errors above." -ForegroundColor Yellow
    }
    
    Write-Info "Documentation: See OFFLINE_SETUP_GUIDE.md for details"
    Write-Info "Start your application with: npm start (or your preferred method)"
}

# Run main
Main

Read-Host "Press Enter to exit"
