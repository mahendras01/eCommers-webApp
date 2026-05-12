from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class OrderStatus(PyEnum):
    PLACED = 'placed'
    CONFIRMED = 'confirmed'
    PACKED = 'packed'
    SHIPPED = 'shipped'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    PAYMENT_PENDING = 'payment_pending'
    FAILED = 'failed'


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(length=50), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    status = Column(Enum(OrderStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=OrderStatus.PLACED.value)
    total_amount = Column(Float, nullable=False, default=0.0)
    shipping_address = Column(String(length=500), nullable=True)
    payment_method = Column(String(length=100), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(String(length=500), nullable=True)
    refund_requested = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    payment_transaction = relationship('PaymentTransaction', back_populates='order', uselist=False, cascade='all, delete-orphan')
    shipment = relationship('Shipment', back_populates='order', uselist=False, cascade='all, delete-orphan')
    status_history = relationship('OrderStatusHistory', back_populates='order', cascade='all, delete-orphan', lazy='joined')


class OrderStatusHistory(Base):
    __tablename__ = 'order_status_history'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, index=True)
    status = Column(String(length=50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    notes = Column(String(length=500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship('Order', back_populates='status_history')


class OrderItem(Base):
    __tablename__ = 'order_items'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship('Order', back_populates='items')
    product = relationship('Product')
