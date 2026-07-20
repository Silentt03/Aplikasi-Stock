@REM Minimal Git Push Script - Run in Command Prompt
@REM This script will push the project to GitHub

@cd /d c:\PROJECT
@echo.
@echo ============================================
@echo         Git Push to GitHub
@echo ============================================
@echo.

@REM Kill any hanging processes
@taskkill /F /IM ssh-keygen.exe 2>nul

@REM Wait a moment
@timeout /t 2 /nobreak

@echo Pushing to GitHub...
@echo.

@REM Execute push
@git push -u origin main

@REM Check result
@if %ERRORLEVEL% EQU 0 (
    @echo.
    @echo ✓ SUCCESS: Repository pushed to GitHub!
    @echo.
) ELSE (
    @echo.
    @echo ✗ FAILED: Push encountered an error
    @echo Please check your GitHub credentials
    @echo.
)

@echo ============================================
@pause
