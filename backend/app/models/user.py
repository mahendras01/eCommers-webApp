from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=120), nullable=False)
    email = Column(String(length=255), unique=True, nullable=False, index=True)
    mobile_number = Column(String(length=20), unique=True, nullable=True, index=True)
    hashed_password = Column(String(length=255), nullable=False)
    role = Column(String(length=32), nullable=False, default='user')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

