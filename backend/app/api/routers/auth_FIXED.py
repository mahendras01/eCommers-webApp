import re
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserRead
from app.services.auth import create_access_token, create_refresh_token, decode_refresh_token, hash_password, verify_password
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix='/auth', tags=['Authentication'])

EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PHONE_PATTERN = re.compile(r'^\d{10}$')


def is_email(identifier: str) -> bool:
    return bool(EMAIL_PATTERN.match(identifier))


def is_mobile(identifier: str) -> bool:
    return bool(PHONE_PATTERN.match(identifier))


@router.post('/signup', response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user_create: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account
    
    Security:
    - Password validated for strength
    - Email already exists check
    - Mobile number uniqueness
    """
    existing_email = db.query(User).filter(User.email == user_create.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email already registered'
        )

    if user_create.mobile_number:
        existing_mobile = db.query(User).filter(
            User.mobile_number == user_create.mobile_number
        ).first()
        if existing_mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Mobile number already registered'
            )

    user = User(
        name=user_create.name,
        email=user_create.email,
        mobile_number=user_create.mobile_number,
        hashed_password=hash_password(user_create.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log user registration
    logger.info(f"New user registered: {user.email}")
    
    return user


@router.post('/login', response_model=Token)
@limiter.limit("5/minute")  # 5 login attempts per minute per IP
def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login endpoint with rate limiting
    
    Security:
    - Rate limited to 5 attempts/minute
    - Generic error messages (no user enumeration)
    - Refresh token stored as httpOnly cookie
    - Access token returned in body
    """
    identifier = credentials.identifier.strip()

    # Find user by email or phone
    if is_email(identifier):
        user = db.query(User).filter(User.email == identifier).first()
    elif is_mobile(identifier):
        user = db.query(User).filter(User.mobile_number == identifier).first()
    else:
        # Log suspicious attempt
        logger.warning(f"Invalid identifier format from {request.client.host}: {identifier[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail='Invalid identifier format'
        )

    # Verify credentials without revealing which failed
    if not user or not verify_password(credentials.password, user.hashed_password):
        # Log failed attempt
        logger.warning(f"Failed login attempt for {identifier} from {request.client.host}")
        
        # Generic error - don't reveal if email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid credentials'
        )

    # Create tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token_str = create_refresh_token(subject=str(user.id))

    # Store refresh token in database
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        is_revoked=False
    )
    db.add(refresh_token)
    db.commit()

    # Set refresh token as httpOnly cookie (secure, not accessible to JS)
    response.set_cookie(
        key='refresh_token',
        value=refresh_token_str,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,              # Critical: Not accessible to JavaScript
        secure=True,                # HTTPS only
        samesite='strict'           # CSRF protection
    )

    logger.info(f"User logged in: {user.email}")

    return {
        'access_token': access_token,
        'token_type': 'bearer'
        # Note: refresh_token NOT returned (it's in httpOnly cookie)
    }


@router.post('/refresh', response_model=Token)
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from cookie
    
    Security:
    - Gets refresh token from httpOnly cookie (not body)
    - Marks old token as revoked
    - Issues new tokens with rotation
    """
    # Get refresh token from cookie
    refresh_token_str = request.cookies.get('refresh_token')
    
    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Refresh token missing'
        )

    try:
        user_id = decode_refresh_token(refresh_token_str)
    except Exception as e:
        logger.warning(f"Invalid refresh token from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid refresh token'
        )

    # Check if refresh token exists in DB and is valid
    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token_str,
        RefreshToken.expires_at > datetime.utcnow(),
        RefreshToken.is_revoked == False  # NEW: Check not revoked
    ).first()

    if not stored_token:
        logger.warning(f"Refresh token not found or expired from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Refresh token expired or invalid'
        )

    # CRITICAL: Revoke old token (token rotation)
    stored_token.is_revoked = True
    db.add(stored_token)

    # Generate new tokens
    new_access_token = create_access_token(subject=user_id)
    new_refresh_token_str = create_refresh_token(subject=user_id)

    # Store new refresh token
    new_token_record = RefreshToken(
        token=new_refresh_token_str,
        user_id=int(user_id),
        expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        is_revoked=False
    )
    db.add(new_token_record)
    db.commit()

    # Set new refresh token as httpOnly cookie
    response.set_cookie(
        key='refresh_token',
        value=new_refresh_token_str,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite='strict'
    )

    logger.info(f"Token refreshed for user: {user_id}")

    return {
        'access_token': new_access_token,
        'token_type': 'bearer'
    }


@router.post('/logout')
def logout(
    current_user: User = Depends(get_current_user),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """
    Logout user and revoke all refresh tokens
    
    Security:
    - Revokes all refresh tokens
    - Clears httpOnly cookie
    """
    # Revoke all refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False
    ).update({'is_revoked': True})
    db.commit()

    # Clear refresh token cookie
    response.delete_cookie(
        key='refresh_token',
        secure=True,
        httponly=True,
        samesite='strict'
    )

    logger.info(f"User logged out: {current_user.email}")

    return {'message': 'Logged out successfully'}


@router.get('/me', response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user
