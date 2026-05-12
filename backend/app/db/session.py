from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Ensure relative SQLite database paths are resolved relative to the backend package,
# not the current working directory, so the app uses the correct database file.
database_url = settings.database_url
if database_url.startswith('sqlite:///'):
    sqlite_path = database_url[len('sqlite:///'):]
    if not Path(sqlite_path).is_absolute():
        backend_dir = Path(__file__).resolve().parent.parent
        database_url = f"sqlite:///{backend_dir / sqlite_path}"

connect_args = {'check_same_thread': False} if database_url.startswith('sqlite') else {}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
