from pathlib import Path
from typing import Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Database
    database_url: str = Field(default='sqlite:///ecommerce.db', env='DATABASE_URL')
    
    # JWT Security - REQUIRED and must be strong
    jwt_secret_key: str = Field(..., env='JWT_SECRET_KEY')
    algorithm: str = Field('HS256', env='ALGORITHM')
    access_token_expire_minutes: int = Field(15, env='ACCESS_TOKEN_EXPIRE_MINUTES')  # Reduced from 60
    refresh_token_expire_days: int = Field(7, env='REFRESH_TOKEN_EXPIRE_DAYS')  # NEW
    
    # CORS Configuration
    cors_origins: list[str] = Field(
        default_factory=lambda: ['http://localhost:5173'],
        env='CORS_ORIGINS'
    )
    
    # Razorpay Configuration
    razorpay_key_id: Optional[str] = Field(default=None, env='RAZORPAY_KEY_ID')
    razorpay_key_secret: Optional[str] = Field(default=None, env='RAZORPAY_KEY_SECRET')
    
    # Environment Settings
    debug: bool = Field(default=False, env='DEBUG')
    environment: str = Field(default='production', env='ENVIRONMENT')
    
    @validator('jwt_secret_key')
    def validate_secret_key(cls, v):
        """Validate JWT secret key strength"""
        if len(v) < 32:
            raise ValueError('JWT_SECRET_KEY must be at least 32 characters long')
        
        # Check for default/placeholder values
        weak_keys = [
            'your-secret-key',
            'supersecretkey-change-me',
            'your-secret-key-here',
            'changeme'
        ]
        
        if v.lower() in weak_keys:
            raise ValueError(
                'Default/placeholder JWT_SECRET_KEY detected. '
                'Generate a strong secret: '
                'python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        
        return v
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse comma-separated CORS origins"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    @validator('debug')
    def validate_debug_production(cls, v, values):
        """Warn if debug enabled in production"""
        if v and values.get('environment') == 'production':
            raise ValueError('DEBUG cannot be True in production environment')
        return v
    
    class Config:
        env_file = BASE_DIR / '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = False

# Initialize settings
try:
    settings = Settings()
except Exception as e:
    print(f"⚠️  Configuration Error: {e}")
    print("Please check your .env file")
    raise
