# E-Commerce Web App

This repository contains a small-scale production-ready e-commerce web application.

## Frontend
- ReactJS with Vite
- Tailwind CSS
- React Router
- Axios

## Getting started

### Backend Setup

1. **Initialize database and seed data** (idempotent - safe to run multiple times):

```bash
cd backend
python run_setup.py
```

Or use the shell script:
```bash
cd backend
bash run_setup.sh
```

This will:
- ✅ Create admin user (if not exists): `admin@test.com` / `StrongAdminP@ss1`
- ✅ Seed 8 categories with 45 subcategories
- ✅ Skip duplicates automatically

2. **Start the backend server**:

```bash
cd backend
./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/docs for the FastAPI API docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

### If you need to run individual setup scripts:

```bash
cd backend
./venv/bin/python create_admin.py      # Create admin user
./venv/bin/python seed_data.py         # Seed categories/subcategories
```

Both scripts are idempotent (duplicate-safe).

## Next step
Build the FastAPI backend with SQLite and JWT authentication.
