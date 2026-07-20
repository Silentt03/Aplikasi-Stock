const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = 'c:\\PROJECT';
process.chdir(projectDir);

console.log('='.repeat(60));
console.log('Git Push Automation - Node.js Version');
console.log('='.repeat(60));

try {
    console.log('\n1. Killing ssh-keygen processes...');
    try {
        execSync('taskkill /F /IM ssh-keygen.exe', { stdio: 'pipe' });
        console.log('   ✓ Processes killed');
    } catch (e) {
        console.log('   - No ssh-keygen processes found (OK)');
    }

    console.log('\n2. Configuring git...');
    execSync('git config --global user.name "Silentt03"', { stdio: 'pipe' });
    console.log('   ✓ User name set');
    
    execSync('git config --global user.email "unioncollective03@gmail.com"', { stdio: 'pipe' });
    console.log('   ✓ User email set');
    
    execSync('git config --global credential.helper wincred', { stdio: 'pipe' });
    console.log('   ✓ Credential helper set');

    console.log('\n3. Checking git status...');
    const status = execSync('git status --short', { encoding: 'utf-8' });
    if (status.trim()) {
        console.log('   Changes to commit:');
        console.log(status);
    } else {
        console.log('   ✓ Working tree clean');
    }

    console.log('\n4. Checking remote configuration...');
    const remote = execSync('git remote -v', { encoding: 'utf-8' });
    console.log(remote);

    console.log('\n5. Attempting to push to GitHub...');
    console.log('   $ git push -u origin main');
    
    try {
        const pushResult = execSync('git push -u origin main 2>&1', { 
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000
        });
        console.log(pushResult);
        console.log('\n✅ Push successful!');
    } catch (pushError) {
        const output = pushError.stdout ? pushError.stdout.toString() : '';
        const stderr = pushError.stderr ? pushError.stderr.toString() : '';
        
        console.log('Output:', output);
        if (stderr) console.log('Error:', stderr);
        
        if (pushError.code !== 0) {
            console.log('\n⚠️ Push encountered an error.');
            console.log('This might be due to:');
            console.log('  - Authentication failure (credentials invalid)');
            console.log('  - Network issue');
            console.log('  - Repository access denied');
            console.log('\nTry pushing manually with: git push -u origin main');
        }
    }

} catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stdout) console.log('Output:', error.stdout.toString());
}

console.log('\n' + '='.repeat(60));
console.log('Done!');
console.log('='.repeat(60));
