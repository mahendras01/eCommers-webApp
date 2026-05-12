from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class RazorpayOrderCreate(BaseModel):
    """Schema for creating Razorpay order"""
    amount: int = Field(..., gt=0, description="Amount in paise (e.g., 50000 for ₹500)")
    currency: str = Field(default="INR", description="Currency code")
    receipt: str = Field(..., description="Order receipt/reference ID")
    notes: Optional[dict] = Field(default=None, description="Additional order notes")

    @validator('currency')
    def validate_currency(cls, v):
        if v not in ['INR', 'USD', 'EUR']:
            raise ValueError('Currency must be one of: INR, USD, EUR')
        return v


class RazorpayOrderResponse(BaseModel):
    """Response from Razorpay order creation"""
    order_id: str = Field(..., description="Razorpay order ID")
    amount: int = Field(..., description="Amount in paise")
    currency: str = Field(..., description="Currency code")
    receipt: str = Field(..., description="Receipt/reference ID")


class PaymentVerificationRequest(BaseModel):
    """Schema for verifying payment signature"""
    payment_id: str = Field(..., description="Razorpay payment ID")
    order_id: str = Field(..., description="Razorpay order ID")
    signature: str = Field(..., description="Razorpay payment signature")

    @validator('payment_id', 'order_id', 'signature')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v


class PaymentVerificationResponse(BaseModel):
    """Response after payment verification"""
    status: str = Field(..., description="Payment status (success/failure)")
    message: str = Field(..., description="Status message")
    transaction_id: Optional[str] = Field(default=None, description="Transaction ID in our system")


class TransactionRecord(BaseModel):
    """Database transaction record"""
    order_id: int = Field(..., description="Our order ID")
    razorpay_order_id: str = Field(..., description="Razorpay order ID")
    razorpay_payment_id: str = Field(..., description="Razorpay payment ID")
    razorpay_signature: str = Field(..., description="Payment signature")
    amount: int = Field(..., description="Amount in paise")
    currency: str = Field(..., description="Currency code")
    payment_method: str = Field(..., description="Payment method used")
    status: str = Field(default="captured", description="Payment status")
    created_at: Optional[datetime] = Field(default=None, description="Transaction timestamp")

    class Config:
        from_attributes = True
