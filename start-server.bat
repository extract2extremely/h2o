@echo off
REM FinCollect Local Web Server for Windows
REM This script starts a local development server to run FinCollect properly

cls
echo.
echo ════════════════════════════════════════════════════════════
echo   FinCollect Local Development Server
echo ════════════════════════════════════════════════════════════
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Error: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo ✓ Python found
echo.
echo ════════════════════════════════════════════════════════════
echo Starting server on http://localhost:8000
echo ════════════════════════════════════════════════════════════
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the Python server script
python "%~dp0server.py"

pause
