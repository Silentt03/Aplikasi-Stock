@echo off
REM Kill ssh-keygen process
taskkill /F /IM ssh-keygen.exe 2>nul
timeout /t 2

REM Configure git and push
cd /d c:\PROJECT
git config --global user.name "Silentt03"
git config --global user.email "unioncollective03@gmail.com"
git config --global credential.helper wincred
git remote -v
echo.
echo Attempting git push...
git push -u origin main 2>&1
echo.
echo Done!
pause
