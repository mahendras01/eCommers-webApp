from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.db.base import Base


class ShipmentStatus(PyEnum):
    CREATED = "created"
    PACKED = "packed"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETURNED = "returned"


class Shipment(Base):
    __tablename__ = 'shipments'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, index=True, unique=True)
    tracking_number = Column(String(length=100), nullable=False, unique=True, index=True)
    courier_name = Column(String(length=100), nullable=False)
    status = Column(Enum(ShipmentStatus), nullable=False, default=ShipmentStatus.CREATED)
    estimated_delivery_date = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship with Order
    order = relationship('Order', back_populates='shipment')

    # Tracking timeline entries
    tracking_entries = relationship('ShipmentTracking', back_populates='shipment', cascade='all, delete-orphan')


class ShipmentTracking(Base):
    __tablename__ = 'shipment_tracking'

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey('shipments.id'), nullable=False, index=True)
    status = Column(Enum(ShipmentStatus), nullable=False)
    location = Column(String(length=200), nullable=True)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship with Shipment
    shipment = relationship('Shipment', back_populates='tracking_entries')