import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserRead
from app.services.auth import create_access_token, create_refresh_token, decode_refresh_token, hash_password, verify_password

router = APIRouter(prefix='/auth', tags=['Authentication'])

# Rate limiter for this router
limiter = Limiter(key_func=get_remote_address)

EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PHONE_PATTERN = re.compile(r'^\d{10}$')


def is_email(identifier: str) -> bool:
    return bool(EMAIL_PATTERN.match(identifier))


def is_mobile(identifier: str) -> bool:
    return bool(PHONE_PATTERN.match(identifier))


@router.post('/signup', response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user_create: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user_create.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already registered')

    if user_create.mobile_number:
        existing_mobile = db.query(User).filter(User.mobile_number == user_create.mobile_number).first()
        if existing_mobile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Mobile number already registered')

    user = User(
        name=user_create.name,
        email=user_create.email,
        mobile_number=user_create.mobile_number,
        hashed_password=hash_password(user_create.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post('/login')
@limiter.limit("5/minute")  # 5 login attempts per minute per IP
def login(request: Request, credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    identifier = credentials.identifier.strip()

    if is_email(identifier):
        user = db.query(User).filter(User.email == identifier).first()
    elif is_mobile(identifier):
        user = db.query(User).filter(User.mobile_number == identifier).first()
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Invalid identifier format')

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    access_token = create_access_token(subject=str(user.id))
    refresh_token_str = create_refresh_token(subject=str(user.id))

    # Store refresh token in DB
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=7)  # 7 days expiry
    )
    db.add(refresh_token)
    db.commit()

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
        path="/"
    )

    return {'access_token': access_token, 'token_type': 'bearer'}


@router.post('/refresh')
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    # Get refresh token from httpOnly cookie
    refresh_token_str = request.cookies.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token missing')

    try:
        user_id = decode_refresh_token(refresh_token_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    # Check if refresh token exists in DB and is not expired/revoked
    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token_str,
        RefreshToken.expires_at > datetime.utcnow(),
        RefreshToken.is_revoked == False
    ).first()

    if not stored_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token expired or invalid')

    # ✅ REVOKE OLD TOKEN (token rotation)
    stored_token.is_revoked = True
    db.add(stored_token)
    db.flush()

    # Generate new tokens
    new_access_token = create_access_token(subject=user_id)
    new_refresh_token_str = create_refresh_token(subject=user_id)

    # Create NEW token record
    new_token_record = RefreshToken(
        token=new_refresh_token_str,
        user_id=int(user_id),
        expires_at=datetime.utcnow() + timedelta(days=7),
        is_revoked=False
    )
    db.add(new_token_record)
    db.commit()

    # Set new refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )

    return {'access_token': new_access_token, 'token_type': 'bearer'}


@router.post('/logout')
def logout(response: Response):
    # Clear the refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    return {'message': 'Logged out successfully'}


@router.get('/profile', response_model=UserRead)
def profile(current_user: User = Depends(get_current_user)):
    return current_user
