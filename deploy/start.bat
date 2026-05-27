@echo off
chcp 65001 >nul
title Hvideo Lite Server

set APP_DIR=F:\Hvideo lite web\backend
set PORT=8000
set HOST=0.0.0.0

echo ========================================
echo   Hvideo Lite — AI Platform
echo   Starting server on %HOST%:%PORT%
echo ========================================
echo.

:: Activate virtual environment if exists
if exist "%APP_DIR%\venv\Scripts\activate.bat" (
    call "%APP_DIR%\venv\Scripts\activate.bat"
)

cd /d "%APP_DIR%"

:: Kill any existing process on port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%"') do (
    taskkill /f /pid %%a >nul 2>&1
)

uvicorn main:app --host %HOST% --port %PORT% --reload

pause
