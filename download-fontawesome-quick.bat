@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Quick Font Awesome Download - Fast Setup
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║       Font Awesome Download - Quick Setup (2 minutes)         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set "libDir=%~dp0lib"

echo [i] Creating Font Awesome directory structure...
if not exist "%libDir%\fontawesome\css" mkdir "%libDir%\fontawesome\css"
if not exist "%libDir%\fontawesome\webfonts" mkdir "%libDir%\fontawesome\webfonts"

echo [i] Downloading Font Awesome 6.4.0...
echo.

powershell -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$zipPath = '%libDir%\fontawesome.zip'; " ^
  "$url = 'https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-web.zip'; " ^
  "try { " ^
    "Write-Host '[*] Downloading from CDN...' -ForegroundColor Cyan; " ^
    "Invoke-WebRequest -Uri $url -OutFile $zipPath -ErrorAction Stop; " ^
    "Write-Host '[✓] Downloaded successfully!' -ForegroundColor Green; " ^
    "Write-Host '[*] Extracting files...' -ForegroundColor Cyan; " ^
    "Expand-Archive -Path $zipPath -DestinationPath '%libDir%\fa-extract' -Force; " ^
    "$css = Get-ChildItem -Path '%libDir%\fa-extract' -Filter 'all.min.css' -Recurse ^| Select-Object -First 1; " ^
    "if ($css) { Copy-Item $css.FullName -Destination '%libDir%\fontawesome\css\' -Force; Write-Host '[✓] CSS copied' -ForegroundColor Green; } " ^
    "$fonts = Get-ChildItem -Path '%libDir%\fa-extract' -Include '*.woff*','*.ttf' -Recurse; " ^
    "if ($fonts) { $fonts ^| ForEach-Object { Copy-Item $_.FullName -Destination '%libDir%\fontawesome\webfonts\' -Force }; Write-Host '[✓] Fonts copied (' $fonts.Count ' files)' -ForegroundColor Green; } " ^
    "Remove-Item $zipPath -Force -ErrorAction SilentlyContinue; " ^
    "Remove-Item '%libDir%\fa-extract' -Recurse -Force -ErrorAction SilentlyContinue; " ^
  "} " ^
  "catch { " ^
    "Write-Host '[✗] Download failed: $_' -ForegroundColor Red; " ^
    "exit 1; " ^
  "}"

if %errorlevel% equ 0 (
  echo.
  echo ╔════════════════════════════════════════════════════════════════╗
  echo ║                   ✓ Download Complete!                        ║
  echo ║                                                                ║
  echo ║  Icons should now display properly in your application.      ║
  echo ║  Refresh your browser (Ctrl+F5) to see the changes.          ║
  echo ╚════════════════════════════════════════════════════════════════╝
) else (
  echo.
  echo [✗] Download failed. Check your internet connection.
  echo [i] Icons will still display using CDN fallback.
)

echo.
pause
