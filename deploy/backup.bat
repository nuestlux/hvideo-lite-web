@echo off
chcp 65001 >nul
set BACKUP_DIR=F:\HvideoLite_Backups
set DB_PATH=F:\Hvideo lite web\backend\hvideolite.db
set UPLOADS_DIR=F:\Hvideo lite web\backend\uploads
set DATE=%DATE:~-10,4%%DATE:~-7,2%%DATE:~-4,2%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_NAME=%BACKUP_DIR%\hvideolite_%DATE%

echo [%DATE% %TIME%] Starting backup...

:: Backup database
copy "%DB_PATH%" "%BACKUP_NAME%.db" >nul
echo [OK] Database backed up

:: Backup uploads
if exist "%UPLOADS_DIR%" (
    robocopy "%UPLOADS_DIR%" "%BACKUP_NAME%_uploads" /E /R:3 /W:5 /NP /NFL /NDL >nul
    echo [OK] Uploads backed up
)

:: Keep only last 7 backups
forfiles /p "%BACKUP_DIR%" /m "hvideolite_*" /d -7 /c "cmd /c del @path" >nul 2>&1

echo [OK] Backup complete: %BACKUP_NAME%
