from datetime import datetime
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator

EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PHONE_PATTERN = re.compile(r'^\d{10}$')


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    mobile_number: Optional[str] = Field(default=None, min_length=10, max_length=20)
    password: str = Field(..., min_length=8)

    @validator('mobile_number')
    def validate_mobile_number(cls, value):
        if value is None or value == '':
            return value
        if not PHONE_PATTERN.match(value):
            raise ValueError('Mobile number must be a 10-digit numeric string')
        return value


class UserLogin(BaseModel):
    identifier: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)

    @validator('identifier')
    def validate_identifier(cls, value):
        value = value.strip()
        if not value:
            raise ValueError('Identifier is required')
        if '@' in value:
            if not EMAIL_PATTERN.match(value):
                raise ValueError('Identifier must be a valid email or 10-digit mobile number')
        elif not PHONE_PATTERN.match(value):
            raise ValueError('Identifier must be a valid email or 10-digit mobile number')
        return value


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    mobile_number: Optional[str]
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserReadWithOrderCount(UserRead):
    total_orders: int = 0

    class Config:
        from_attributes = True


class TopUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    total_orders: int

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_revenue: float
    top_users: list[TopUser]


class UserRoleUpdate(BaseModel):
    role: str

    @validator('role')
    def validate_role(cls, value):
        valid_roles = ['user', 'admin']
        if value not in valid_roles:
            raise ValueError('Role must be one of: ' + ', '.join(valid_roles))
        return value

    class Config:
        from_attributes = True
