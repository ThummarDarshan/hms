# HMS - Hospital Management System

Full-stack Hospital Management System with a Django REST backend and a React + Vite frontend.

## Tech Stack

- Backend: Django, Django REST Framework, JWT auth
- Database: PostgreSQL (default), SQLite (local fallback)
- Frontend: React, TypeScript, Vite, Tailwind CSS, Axios

## Project Structure

```
HMS/
  clinic_backend/      # Django API backend
  clinic_frontend/     # React frontend
  .gitignore
  README.md
```

Backend Django apps:

- accounts
- patients
- doctors
- appointments
- records
- billing
- support
- beds
- laboratory

## Prerequisites

- Python 3.10+ (recommended)
- Node.js 18+ and npm
- PostgreSQL (only if you use default backend settings)

## 1) Backend Setup

Open terminal in `HMS/clinic_backend`.

### Create and activate virtual environment (Windows PowerShell)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Install dependencies

```powershell
pip install -r requirements.txt
```

### Configure environment

Create a `.env` file in `clinic_backend/`:

```env
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# PostgreSQL (default settings file)
DATABASE_NAME=neondb
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=your_password
DATABASE_HOST=your_postgres_host
DATABASE_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:8082,http://127.0.0.1:8082
FRONTEND_URL=http://localhost:8082
```

### Run migrations

PostgreSQL mode (default):

```powershell
python manage.py makemigrations
python manage.py migrate
```

SQLite mode (easy local dev):

```powershell
python manage.py makemigrations --settings=clinic_backend.settings_sqlite
python manage.py migrate --settings=clinic_backend.settings_sqlite
```

### Run backend server

PostgreSQL mode:

```powershell
python manage.py runserver 0.0.0.0:8000
```

SQLite mode:

```powershell
python manage.py runserver 0.0.0.0:8000 --settings=clinic_backend.settings_sqlite
```

Backend API base URL:

- http://localhost:8000/api

## 2) Frontend Setup

Open terminal in `HMS/clinic_frontend`.

### Install dependencies

```powershell
npm install
```

### Run development server

```powershell
npm run dev
```

Frontend runs on:

- http://localhost:8082

The frontend API client is configured to call backend at port `8000` on the same host.

## API Routes (high-level)

- `/api/token/`
- `/api/token/refresh/`
- `/api/accounts/`
- `/api/patients/`
- `/api/doctors/`
- `/api/appointments/`
- `/api/records/`
- `/api/billing/`
- `/api/support/`
- `/api/beds/`
- `/api/laboratory/`

## Useful Commands

Backend (inside `clinic_backend`):

```powershell
python manage.py createsuperuser
python manage.py test
```

Frontend (inside `clinic_frontend`):

```powershell
npm run lint
npm run test
npm run build
npm run preview
```

## Troubleshooting

- If backend fails with database connection error, use SQLite mode commands above.
- If CORS errors appear, verify `CORS_ALLOWED_ORIGINS` includes `http://localhost:8082`.
- If token refresh/login fails, confirm backend is running on port `8000`.

## License

Add your preferred license information here.
