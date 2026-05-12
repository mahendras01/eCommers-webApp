from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=1)


class PaymentDetails(BaseModel):
    payment_method: Optional[str] = None
    upi_id: Optional[str] = None
    card_number: Optional[str] = None
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None
    cvv: Optional[str] = None
    card_holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    wallet_provider: Optional[str] = None

    @validator('upi_id', pre=True, always=True)
    def validate_upi(cls, v, values):
        payment_method = values.get('payment_method')
        if payment_method == 'upi' and not v:
            raise ValueError('UPI ID is required for UPI payment')
        if v and not re.match(r'^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$', v):
            raise ValueError('Invalid UPI ID format')
        return v

    @validator('card_number', pre=True, always=True)
    def validate_card_number(cls, v, values):
        payment_method = values.get('payment_method')
        if payment_method in ['credit_card', 'debit_card'] and not v:
            raise ValueError('Card number is required')
        if v and not re.match(r'^\d{13,19}$', v.replace(' ', '')):
            raise ValueError('Invalid card number format')
        return v

    @validator('cvv', pre=True, always=True)
    def validate_cvv(cls, v, values):
        payment_method = values.get('payment_method')
        if payment_method in ['credit_card', 'debit_card'] and not v:
            raise ValueError('CVV is required')
        if v and not re.match(r'^\d{3,4}$', v):
            raise ValueError('Invalid CVV format')
        return v

    @validator('bank_name', pre=True, always=True)
    def validate_bank(cls, v, values):
        payment_method = values.get('payment_method')
        if payment_method == 'net_banking' and not v:
            raise ValueError('Bank selection is required for net banking')
        return v

    @validator('wallet_provider', pre=True, always=True)
    def validate_wallet(cls, v, values):
        payment_method = values.get('payment_method')
        if payment_method == 'wallet' and not v:
            raise ValueError('Wallet provider is required')
        return v


class OrderCreate(BaseModel):
    shipping_address: str = Field(..., max_length=500)  # Make it required
    payment_method: str = Field(..., max_length=100)
    payment_details: Optional[PaymentDetails] = None

    @validator('payment_method')
    def validate_payment_method(cls, v):
        valid_methods = ['upi', 'credit_card', 'debit_card', 'net_banking', 'wallet', 'cash_on_delivery']
        if v not in valid_methods:
            raise ValueError(f'Invalid payment method. Must be one of: {", ".join(valid_methods)}')
        return v

    @validator('payment_details', pre=True, always=True)
    def validate_payment_details(cls, v, values):
        payment_method = values.get('payment_method')
        # For Razorpay payment methods, payment details are not required upfront
        razorpay_methods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
        if payment_method not in razorpay_methods and payment_method != 'cash_on_delivery' and not v:
            raise ValueError('Payment details are required for this payment method')
        return v


class ProductInOrder(BaseModel):
    id: int
    name: str
    price: float
    image_url: Optional[str]

    class Config:
        from_attributes = True


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductInOrder

    class Config:
        from_attributes = True


class UserInOrder(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    order_number: str
    user_id: int
    user_order_index: Optional[int] = None
    status: str
    total_amount: float
    shipping_address: Optional[str]
    payment_method: Optional[str]
    cancelled_at: Optional[datetime]
    cancel_reason: Optional[str]
    refund_requested: Optional[bool]
    created_at: datetime
    items: list[OrderItemRead]

    model_config = {
        'from_attributes': True,
    }


class OrderAdminRead(OrderRead):
    user: UserInOrder

    model_config = {
        'from_attributes': True,
    }


class OrderStatusUpdate(BaseModel):
    status: str

    @validator('status')
    def validate_status(cls, v):
        if not isinstance(v, str):
            raise ValueError('Status must be a string')
        normalized = v.strip().lower()
        valid_statuses = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'payment_pending', 'failed']
        if normalized not in valid_statuses:
            raise ValueError('Status must be one of: ' + ', '.join(valid_statuses))
        return normalized

    model_config = {
        'from_attributes': True,
        'exclude_none': True,
    }


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = None

    @validator('reason')
    def validate_reason(cls, v):
        if v and len(v.strip()) == 0:
            raise ValueError('Cancel reason cannot be blank')
        return v

    model_config = {
        'from_attributes': True,
        'exclude_none': True,
    }


class OrderListRead(BaseModel):
    orders: list[OrderRead]


class OrderStatusHistoryRead(BaseModel):
    id: int
    order_id: int
    status: str
    timestamp: datetime
    notes: Optional[str] = None

    model_config = {
        'from_attributes': True,
    }


class OrderTrackingResponse(BaseModel):
    order_id: int
    order_number: str
    current_status: str
    status_history: list[OrderStatusHistoryRead]
    total_amount: float
    shipping_address: Optional[str]
    created_at: datetime

    model_config = {
        'from_attributes': True,
    }
