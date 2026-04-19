@echo off
REM ═════════════════════════════════════════════════════════════════════════════
REM FinCollect Offline Libraries Download Script (Batch Version)
REM For Windows Command Prompt
REM ═════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║       FinCollect - Offline Libraries Download Script          ║
echo ║         Professional Web Development with Font Awesome        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Set paths
for %%A in ("%~dp0.") do set "projectRoot=%%~dpA"
set "libDir=%projectRoot%lib"

echo [i] Project Root: %projectRoot%
echo [i] Library Directory: %libDir%
echo.

REM Create directories
echo [i] Creating directory structure...
if not exist "%libDir%\fontawesome\css" mkdir "%libDir%\fontawesome\css"
if not exist "%libDir%\fontawesome\webfonts" mkdir "%libDir%\fontawesome\webfonts"
if not exist "%libDir%\chartjs" mkdir "%libDir%\chartjs"
if not exist "%libDir%\sweetalert2" mkdir "%libDir%\sweetalert2"
if not exist "%libDir%\jspdf" mkdir "%libDir%\jspdf"
if not exist "%libDir%\html2canvas" mkdir "%libDir%\html2canvas"
if not exist "%projectRoot%fonts" mkdir "%projectRoot%fonts"
echo [✓] Directories created

echo.
echo [i] This script will download the following libraries:
echo     - Font Awesome 6.4.0 (Professional Icons)
echo     - Chart.js 4.x (Data Visualization)
echo     - SweetAlert2 (Beautiful Alerts)
echo     - jsPDF 2.5.1 (PDF Generation)
echo     - html2canvas (Screenshot Tool)
echo     - Inter Font (Professional Typography)
echo.

echo [!] Note: Requires internet connection for downloads
echo [!] Requires approximately 1GB+ free space during extraction
echo.

pause

REM Option to use PowerShell for better download capabilities
echo [i] Using PowerShell for enhanced downloads...
echo.

REM Create temporary PowerShell script
set "psScript=%temp%\fincollect-download.ps1"

(
    echo $ErrorActionPreference = "Continue"
    echo $ProgressPreference = 'SilentlyContinue'
    echo.
    echo function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
    echo function Write-Error2 { Write-Host "[✗] $args" -ForegroundColor Red }
    echo function Write-Info { Write-Host "[i] $args" -ForegroundColor Cyan }
    echo.
    echo Write-Info "Downloading libraries..."
    echo.
    echo # Font Awesome
    echo Write-Info "1/6 Downloading Font Awesome 6.4.0..."
    echo $fontAwesomeUrl = "https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-web.zip"
    echo $zipPath = "%libDir%\fontawesome.zip"
    echo try {
    echo     Invoke-WebRequest -Uri $fontAwesomeUrl -OutFile $zipPath -ErrorAction Stop
    echo     Write-Success "Downloaded Font Awesome"
    echo     Expand-Archive -Path $zipPath -DestinationPath "%libDir%\fontawesome-extract" -Force
    echo     $cssSource = Get-ChildItem -Path "%libDir%\fontawesome-extract" -Filter "all.min.css" -Recurse ^| Select-Object -First 1
    echo     if ($cssSource) { Copy-Item $cssSource.FullName -Destination "%libDir%\fontawesome\css\" -Force; Write-Success "Extracted Font Awesome CSS" }
    echo     $webfonts = Get-ChildItem -Path "%libDir%\fontawesome-extract" -Include "*.woff*" -Recurse
    echo     $webfonts ^| ForEach-Object { Copy-Item $_.FullName -Destination "%libDir%\fontawesome\webfonts\" -Force }
    echo     Write-Success "Extracted Font Awesome webfonts"
    echo     Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    echo     Remove-Item "%libDir%\fontawesome-extract" -Recurse -Force -ErrorAction SilentlyContinue
    echo } catch { Write-Error2 "Failed to download Font Awesome. Visit https://fontawesome.com/download" }
    echo.
    echo # Chart.js
    echo Write-Info "2/6 Downloading Chart.js..."
    echo try {
    echo     Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js" -OutFile "%libDir%\chartjs\chart.min.js" -ErrorAction Stop
    echo     Write-Success "Downloaded Chart.js"
    echo } catch { Write-Error2 "Failed to download Chart.js" }
    echo.
    echo # SweetAlert2
    echo Write-Info "3/6 Downloading SweetAlert2..."
    echo try {
    echo     Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/sweetalert2@11.10.0/dist/sweetalert2.min.js" -OutFile "%libDir%\sweetalert2\sweetalert2.min.js" -ErrorAction Stop
    echo     Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/sweetalert2@11.10.0/dist/sweetalert2.min.css" -OutFile "%libDir%\sweetalert2\sweetalert2.min.css" -ErrorAction Stop
    echo     Write-Success "Downloaded SweetAlert2"
    echo } catch { Write-Error2 "Failed to download SweetAlert2" }
    echo.
    echo # jsPDF
    echo Write-Info "4/6 Downloading jsPDF..."
    echo try {
    echo     Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" -OutFile "%libDir%\jspdf\jspdf.umd.min.js" -ErrorAction Stop
    echo     Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js" -OutFile "%libDir%\jspdf\jspdf.plugin.autotable.min.js" -ErrorAction Stop
    echo     Write-Success "Downloaded jsPDF and AutoTable"
    echo } catch { Write-Error2 "Failed to download jsPDF" }
    echo.
    echo # html2canvas
    echo Write-Info "5/6 Downloading html2canvas..."
    echo try {
    echo     Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" -OutFile "%libDir%\html2canvas\html2canvas.min.js" -ErrorAction Stop
    echo     Write-Success "Downloaded html2canvas"
    echo } catch { Write-Error2 "Failed to download html2canvas" }
    echo.
    echo # Inter Font
    echo Write-Info "6/6 Downloading Inter Font..."
    echo try {
    echo     Invoke-WebRequest -Uri "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip" -OutFile "%libDir%\inter-fonts.zip" -ErrorAction Stop
    echo     Write-Success "Downloaded Inter Font"
    echo     Expand-Archive -Path "%libDir%\inter-fonts.zip" -DestinationPath "%libDir%\inter-extract" -Force
    echo     $fonts = Get-ChildItem -Path "%libDir%\inter-extract" -Include "*.woff2","*.woff" -Recurse
    echo     $fonts ^| ForEach-Object { Copy-Item $_.FullName -Destination "%projectRoot%fonts\" -Force }
    echo     Write-Success "Extracted Inter Font files"
    echo     Remove-Item "%libDir%\inter-fonts.zip" -Force -ErrorAction SilentlyContinue
    echo     Remove-Item "%libDir%\inter-extract" -Recurse -Force -ErrorAction SilentlyContinue
    echo } catch { Write-Error2 "Failed to download Inter Font" }
    echo.
    echo Write-Success "Download completed!"
) > "%psScript%"

REM Execute PowerShell script
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%psScript%"

REM Cleanup
del "%psScript%" 2>nul

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   ✓ Script Completed                          ║
echo ║                                                                ║
echo ║  Your FinCollect application is ready for offline use!        ║
echo ║  All libraries have been downloaded to: %libDir%            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

pause
