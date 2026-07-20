#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('c:\\PROJECT')

# Set environment to avoid ssh-keygen
env = os.environ.copy()
env['GIT_SSH_COMMAND'] = 'ssh -o StrictHostKeyChecking=no'
env['GIT_ASKPASS'] = 'c:\\PROJECT\\askpass.bat'

# Configuration
commands = [
    ['git', 'config', '--global', 'credential.helper', 'wincred'],
    ['git', 'config', '--global', 'user.name', 'Silentt03'],
    ['git', 'config', '--global', 'user.email', 'unioncollective03@gmail.com'],
    ['git', 'remote', 'remove', 'origin'],
    ['git', 'remote', 'add', 'origin', 'https://github.com/Silentt03/Aplikasi-Stock.git'],
    ['git', 'status'],
    ['git', 'remote', '-v'],
]

print("="*60)
print("Git Push Automation Script")
print("="*60)

for cmd in commands:
    print(f"\n$ {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=10)
        if result.stdout:
            print(result.stdout.strip())
        if result.stderr and 'warning' not in result.stderr.lower():
            print("Error:", result.stderr.strip())
    except Exception as e:
        print(f"Error executing command: {e}")

# Now attempt the push
print("\n" + "="*60)
print("Attempting to push to GitHub...")
print("="*60)

push_cmd = ['git', 'push', '-u', 'origin', 'main']
print(f"$ {' '.join(push_cmd)}")

try:
    result = subprocess.run(push_cmd, capture_output=True, text=True, env=env, timeout=30, input='\n\n')
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode == 0:
        print("\n✅ Push successful!")
    else:
        print(f"\n❌ Push failed with return code {result.returncode}")
        if result.stderr:
            print("Error output:")
            print(result.stderr.strip())
except subprocess.TimeoutExpired:
    print("❌ Command timed out")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*60)
