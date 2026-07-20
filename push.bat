@echo off
cd /d c:\PROJECT

REM Kill any ssh-keygen processes
taskkill /F /IM ssh-keygen.exe 2>nul

REM Configure git
git config --global credential.helper wincred
git config --global user.name "Silentt03"
git config --global user.email "unioncollective03@gmail.com"

REM Change remote back to HTTPS
git remote remove origin 2>nul
git remote add origin https://github.com/Silentt03/Aplikasi-Stock.git

REM Show current status
echo.
echo Git Status:
git status --short
echo.
echo Remote Configuration:
git remote -v
echo.

REM Store credentials
echo. | powershell -Command "Add-Type -AssemblyName System.Runtime.InteropServices; [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode((Read-Host -AsSecureString -Prompt 'Enter GitHub PAT or password')))"

REM Attempt to push
echo Attempting to push...
git push -u origin main 2>&1

if errorlevel 1 (
    echo Push failed. Checking permissions...
    git push --verbose 2>&1
)

pause
