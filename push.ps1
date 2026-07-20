#!/usr/bin/env pwsh

cd c:\PROJECT

# Setup git configuration
git config --global credential.helper wincred
git config --global user.name "Silentt03"
git config --global user.email "unioncollective03@gmail.com"

# Ensure remote is set to HTTPS
git remote remove origin 2>&1 | Out-Null
git remote add origin "https://github.com/Silentt03/Aplikasi-Stock.git"

# Try to push with stored credentials
Write-Host "Attempting to push to GitHub..."
$gitPush = git push -u origin main 2>&1

if ($gitPush -like "*error*" -or $gitPush -like "*denied*") {
    Write-Host "Push failed with error. Attempting alternative method..."
    
    # Try with explicit credential storage
    @"
protocol=https
host=github.com
username=Silentt03
"@ | git credential approve
    
    # Try push again
    git push -u origin main
} else {
    Write-Host "Push successful!"
    Write-Host $gitPush
}
