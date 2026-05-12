from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ShipmentStatus(str, Enum):
    CREATED = "created"
    PACKED = "packed"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETURNED = "returned"


class ShipmentCreate(BaseModel):
    order_id: int = Field(..., gt=0)
    courier_name: str = Field(..., min_length=1, max_length=100)
    estimated_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None

    @validator('estimated_delivery_date')
    def validate_delivery_date(cls, v):
        if v and v <= datetime.utcnow():
            raise ValueError('Estimated delivery date must be in the future')
        return v


class ShipmentUpdate(BaseModel):
    courier_name: Optional[str] = Field(None, min_length=1, max_length=100)
    estimated_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None

    @validator('estimated_delivery_date')
    def validate_delivery_date(cls, v):
        if v and v <= datetime.utcnow():
            raise ValueError('Estimated delivery date must be in the future')
        return v


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus
    location: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None


class ShipmentTrackingEntry(BaseModel):
    id: int
    status: ShipmentStatus
    location: Optional[str]
    description: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ShipmentRead(BaseModel):
    id: int
    order_id: int
    tracking_number: str
    courier_name: str
    status: ShipmentStatus
    estimated_delivery_date: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    tracking_entries: List[ShipmentTrackingEntry] = []

    class Config:
        from_attributes = True


class TrackingTimeline(BaseModel):
    shipment: ShipmentRead
    order_number: str
    customer_name: str
    shipping_address: str
    current_status: ShipmentStatus
    estimated_delivery: Optional[datetime]
    timeline: List[ShipmentTrackingEntry]