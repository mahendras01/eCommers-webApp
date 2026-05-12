from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class AddressBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=10, max_length=15)
    pincode: str = Field(..., min_length=6, max_length=10)
    locality: str = Field(..., min_length=1, max_length=100)
    address_line1: str = Field(..., min_length=1)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    landmark: Optional[str] = None
    is_default: bool = False

    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+?\d{10,15}$', v):
            raise ValueError('Invalid phone number format')
        return v

    @validator('pincode')
    def validate_pincode(cls, v):
        if not re.match(r'^\d{6,10}$', v):
            raise ValueError('Invalid pincode format')
        return v

class AddressCreate(AddressBase):
    pass

class AddressUpdate(AddressBase):
    pass

class Address(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True