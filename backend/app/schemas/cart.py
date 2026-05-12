from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CartItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class ProductInCart(BaseModel):
    id: int
    name: str
    price: float
    tax_percent: float = 18.0
    image_url: Optional[str]

    class Config:
        from_attributes = True


class CartItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductInCart

    class Config:
        from_attributes = True


class CartRead(BaseModel):
    items: list[CartItemRead]
    total_items: int
    total_price: float
    
    class Config:
        from_attributes = True


class CartCalculationRequest(BaseModel):
    """Request for cart calculation - contains product IDs and quantities."""
    items: list[dict] = Field(..., description="List of {product_id, quantity}")


class CartCalculationResponse(BaseModel):
    """Cart pricing breakdown with tax and shipping."""
    subtotal: float = Field(..., description="Sum of all product prices × quantities")
    tax: float = Field(..., description="Total tax amount")
    tax_breakdown: dict = Field(default_factory=dict, description="Tax breakdown by tax rate")
    shipping: float = Field(default=100.0, description="Shipping cost")
    total: float = Field(..., description="subtotal + tax + shipping")
    items_count: int = Field(..., description="Total number of items")
    
    class Config:
        from_attributes = True

