from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    database_url: str = Field(default='sqlite:///ecommerce.db', env='DATABASE_URL')
    jwt_secret_key: str = Field(..., env='JWT_SECRET_KEY')  # REQUIRED - no default
    algorithm: str = Field('HS256', env='ALGORITHM')
    access_token_expire_minutes: int = Field(15, env='ACCESS_TOKEN_EXPIRE_MINUTES')  # 60 -> 15 min
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:5173'], env='CORS_ORIGINS')
    razorpay_key_id: Optional[str] = Field(default=None, env='RAZORPAY_KEY_ID')
    razorpay_key_secret: Optional[str] = Field(default=None, env='RAZORPAY_KEY_SECRET')

    class Config:
        env_file = BASE_DIR / '.env'
        env_file_encoding = 'utf-8'

settings = Settings()
