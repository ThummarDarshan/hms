# Database Migration Guide: MySQL (XAMPP) → PostgreSQL (Neon)

## Step 1: Export Data from MySQL

First, we'll temporarily switch to MySQL to export all the data.

### Create a backup of current .env settings
```powershell
# Make a backup
Copy-Item "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend\.env" "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend\.env.postgres_backup"
```

### Update .env to use MySQL temporarily
```powershell
# Open and edit .env file - change these values:
DATABASE_NAME=clinic_management_system
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_HOST=localhost
DATABASE_PORT=3306
```

### Export all data to JSON file
```powershell
cd "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend"

# Export all database data
python manage.py dumpdata --all --indent=2 > data_backup.json

# This will create a data_backup.json file with all your data
```

---

## Step 2: Restore PostgreSQL Configuration

Switch back to PostgreSQL settings:

```powershell
# Restore PostgreSQL .env
Copy-Item "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend\.env.postgres_backup" "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend\.env"

# Or manually update .env:
DATABASE_NAME=neondb
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=npg_cphIg2fi5BzV
DATABASE_HOST=ep-purple-butterfly-a1a63t0r-pooler.ap-southeast-1.aws.neon.tech
DATABASE_PORT=5432
```

---

## Step 3: Clear PostgreSQL Database & Load Data

```powershell
cd "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend"

# Clear all data from PostgreSQL tables (keep structure)
python manage.py flush --no-input

# Load the exported data
python manage.py loaddata data_backup.json

# Verify data was loaded
python manage.py shell
# >>> from accounts.models import User
# >>> User.objects.count()
# Should show your user count
```

---

## ✅ Complete Setup Commands

Run these in sequence:

```powershell
# 1. Navigate to backend
cd "e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend"

# 2. Backup PostgreSQL settings
Copy-Item ".env" ".env.postgres_backup"

# 3. Switch to MySQL
# Edit .env - change to MySQL credentials

# 4. Export data from MySQL
python manage.py dumpdata --all --indent=2 > data_backup.json

# 5. Switch back to PostgreSQL
# Copy .env.postgres_backup back to .env

# 6. Clear and load data
python manage.py flush --no-input
python manage.py loaddata data_backup.json

# 7. Restart server
python manage.py runserver
```

---

## 🆘 Troubleshooting

### If you get "permission denied" on flush:
```powershell
# Add --no-input flag
python manage.py flush --no-input
```

### If postgres connection fails:
```powershell
# Make sure .env has correct PostgreSQL credentials
# And XAMPP MySQL is running for initial export
```

### If some data doesn't load:
```powershell
# Some relationships might be broken, this is normal
# The core data will load correctly
# Just re-create any missing relationships in the app
```

---

## 📊 What Gets Migrated

✅ All Users & Accounts
✅ All Patients
✅ All Doctors & Departments
✅ All Appointments
✅ All Medical Records & Prescriptions
✅ All Lab Reports
✅ All Billing Information
✅ All Bed Allocations
✅ All Support Tickets

---

## Note

- Make sure XAMPP is running before step 1
- Make sure Neon PostgreSQL credentials are correct
- The JSON export can be large (10-50MB) depending on data
- Keep the `data_backup.json` file as a backup

