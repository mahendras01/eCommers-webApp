# Backend

FastAPI backend for the e-commerce web application.

## Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## API docs
Open http://127.0.0.1:8000/docs
