from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.routers import auth, product, cart, order, address, payment, shipment
from app.api.routers.admin import router as admin_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from seed_data import seed_categories_and_subcategories

app = FastAPI(
    title='E-Commerce Backend',
    description='FastAPI backend for a small-scale e-commerce app',
    version='0.1.0',
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Rate limit exception handler
def _rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many login attempts. Please try again in 1 minute."}
    )

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  # Explicit methods
    allow_headers=['Content-Type', 'Authorization'],  # Specific headers
    max_age=600,  # Cache preflight for 10 minutes
)


def ensure_mobile_column_exists() -> None:
    if not settings.database_url.startswith('sqlite'):
        return

    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info('users')"))
        existing_columns = [row['name'] for row in result.mappings()]

        if 'mobile_number' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20)"))
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_mobile_number ON users (mobile_number)"
            ))


def ensure_order_columns_exist() -> None:
    if not settings.database_url.startswith('sqlite'):
        return

    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info('orders')"))
        existing_columns = [row['name'] for row in result.mappings()]

        if 'cancelled_at' not in existing_columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN cancelled_at DATETIME"))
        if 'cancel_reason' not in existing_columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN cancel_reason VARCHAR(500)"))
        if 'refund_requested' not in existing_columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN refund_requested BOOLEAN NOT NULL DEFAULT 0"))


@app.on_event('startup')
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_categories_and_subcategories()
    ensure_mobile_column_exists()
    ensure_order_columns_exist()


app.include_router(auth.router)
app.include_router(product.router)
app.include_router(cart.router)
app.include_router(order.router)
app.include_router(address.router, prefix="/addresses", tags=["addresses"])
app.include_router(payment.router)
app.include_router(shipment.router)
app.include_router(admin_router)
