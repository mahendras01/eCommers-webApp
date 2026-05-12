from datetime import datetime, timedelta
from typing import Optional
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {
        'sub': str(subject),
        'exp': expire,
        'type': 'access'
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)  # 30 -> 7 days for security
    payload = {
        'sub': str(subject),
        'exp': expire,
        'type': 'refresh',
        'jti': secrets.token_urlsafe(16)  # Add unique JWT ID to prevent duplicates
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.algorithm])
        token_type = payload.get('type')
        if token_type != 'access':
            raise JWTError('Invalid token type')
        subject: str = payload.get('sub')
        if subject is None:
            raise JWTError()
        return subject
    except JWTError as error:
        raise error


def decode_refresh_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.algorithm])
        token_type = payload.get('type')
        if token_type != 'refresh':
            raise JWTError('Invalid token type')
        subject: str = payload.get('sub')
        if subject is None:
            raise JWTError()
        return subject
    except JWTError as error:
        raise error


def generate_refresh_token_string() -> str:
    return secrets.token_urlsafe(32)
