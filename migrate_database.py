#!/usr/bin/env python
"""
Database Migration Script: MySQL (XAMPP) → PostgreSQL (Neon)
Automated migration of all data from MySQL to PostgreSQL
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Configuration
BACKEND_DIR = Path(__file__).parent / "clinic_backend"
ENV_FILE = BACKEND_DIR / ".env"
BACKUP_DIR = BACKEND_DIR / "backups"
DATA_EXPORT = BACKUP_DIR / f"data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
ENV_MYSQL_BACKUP = ENV_FILE.with_stem(".env.mysql_backup")
ENV_POSTGRES_BACKUP = ENV_FILE.with_stem(".env.postgres_backup")

# MySQL credentials
MYSQL_CONFIG = {
    'DATABASE_NAME': 'clinic_management_system',
    'DATABASE_USER': 'root',
    'DATABASE_PASSWORD': '',
    'DATABASE_HOST': 'localhost',
    'DATABASE_PORT': '3306',
}

# PostgreSQL (Neon) credentials
POSTGRES_CONFIG = {
    'DATABASE_NAME': 'neondb',
    'DATABASE_USER': 'neondb_owner',
    'DATABASE_PASSWORD': 'npg_cphIg2fi5BzV',
    'DATABASE_HOST': 'ep-purple-butterfly-a1a63t0r-pooler.ap-southeast-1.aws.neon.tech',
    'DATABASE_PORT': '5432',
}

def read_env_file():
    """Read current .env file"""
    env_data = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_data[key.strip()] = value.strip()
    return env_data

def write_env_file(config):
    """Write config to .env file"""
    env_data = read_env_file()
    env_data.update(config)
    
    with open(ENV_FILE, 'w') as f:
        for key, value in env_data.items():
            f.write(f"{key}={value}\n")
    print(f"✓ Updated .env file")

def backup_env(backup_file):
    """Backup .env file"""
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r') as src:
            with open(backup_file, 'w') as dst:
                dst.write(src.read())
        print(f"✓ Backed up .env to {backup_file.name}")

def restore_env(backup_file):
    """Restore .env from backup"""
    if backup_file.exists():
        with open(backup_file, 'r') as src:
            with open(ENV_FILE, 'w') as dst:
                dst.write(src.read())
        print(f"✓ Restored .env from {backup_file.name}")

def run_command(cmd, cwd=None):
    """Run shell command"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd or BACKEND_DIR,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def migrate_data():
    """Main migration function"""
    print("\n" + "="*60)
    print("DATABASE MIGRATION: MySQL (XAMPP) → PostgreSQL (Neon)")
    print("="*60 + "\n")
    
    # Create backup directory
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Step 1: Backup current PostgreSQL .env
    print("📋 Step 1: Backing up PostgreSQL configuration...")
    backup_env(ENV_POSTGRES_BACKUP)
    
    # Step 2: Switch to MySQL
    print("\n📋 Step 2: Switching to MySQL configuration...")
    write_env_file(MYSQL_CONFIG)
    print("⚠️  Make sure XAMPP MySQL server is running!")
    input("Press Enter to continue...")
    
    # Step 3: Export data from MySQL
    print("\n📋 Step 3: Exporting data from MySQL...")
    success, stdout, stderr = run_command(
        f"python manage.py dumpdata --all --indent=2 > \"{DATA_EXPORT}\""
    )
    
    if not success or not DATA_EXPORT.exists():
        print(f"❌ Failed to export data from MySQL")
        print(f"Error: {stderr}")
        print(f"\nAttempting to restore PostgreSQL configuration...")
        restore_env(ENV_POSTGRES_BACKUP)
        return False
    
    file_size = DATA_EXPORT.stat().st_size / (1024 * 1024)  # Convert to MB
    print(f"✓ Data exported successfully ({file_size:.2f} MB)")
    print(f"✓ Saved to: {DATA_EXPORT}")
    
    # Step 4: Switch back to PostgreSQL
    print("\n📋 Step 4: Switching back to PostgreSQL configuration...")
    restore_env(ENV_POSTGRES_BACKUP)
    
    # Step 5: Clear PostgreSQL and load data
    print("\n📋 Step 5: Clearing PostgreSQL database...")
    success, stdout, stderr = run_command("python manage.py flush --no-input")
    
    if not success:
        print(f"⚠️  Warning: flush may have encountered issues")
        print(f"Error: {stderr}")
    
    print("\n📋 Step 6: Loading data into PostgreSQL...")
    success, stdout, stderr = run_command(
        f"python manage.py loaddata \"{DATA_EXPORT}\""
    )
    
    if not success:
        print(f"❌ Failed to load data")
        print(f"Error: {stderr}")
        return False
    
    # Extract count info from stdout
    import re
    match = re.search(r'Installed (\d+) object', stdout)
    if match:
        print(f"✓ Imported {match.group(1)} objects successfully")
    
    print(f"✓ Data loaded into PostgreSQL")
    
    # Step 7: Verify
    print("\n📋 Step 7: Verifying migration...")
    success, stdout, stderr = run_command(
        "python manage.py shell -c \"from accounts.models import User; from patients.models import Patient; from doctors.models import Doctor; print(f'Users: {User.objects.count()}'); print(f'Patients: {Patient.objects.count()}'); print(f'Doctors: {Doctor.objects.count()}');\""
    )
    
    if success:
        print("✓ Verification output:")
        print(stdout)
    
    print("\n" + "="*60)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\n📊 Summary:")
    print(f"  • Data exported from MySQL: {file_size:.2f} MB")
    print(f"  • Backup saved: {DATA_EXPORT}")
    print(f"  • Data loaded into PostgreSQL (Neon)")
    print(f"\n🚀 To start the server:")
    print(f"  cd \"{BACKEND_DIR}\"")
    print(f"  python manage.py runserver")
    
    return True

if __name__ == "__main__":
    try:
        success = migrate_data()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Migration failed with error: {e}")
        print(f"\nRestoring PostgreSQL configuration...")
        if ENV_POSTGRES_BACKUP.exists():
            restore_env(ENV_POSTGRES_BACKUP)
        sys.exit(1)
