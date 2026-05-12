from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class PaymentTransaction(Base):
    """Store Razorpay payment transaction details"""
    __tablename__ = 'payment_transactions'

    id = Column(Integer, primary_key=True, index=True)
    
    # Order reference
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, index=True)
    order = relationship('Order', back_populates='payment_transaction')
    
    # Razorpay identifiers
    razorpay_order_id = Column(String(255), nullable=False, unique=True, index=True)
    razorpay_payment_id = Column(String(255), nullable=True, unique=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    # Payment details
    amount = Column(Integer, nullable=False)  # Amount in paise
    currency = Column(String(10), default='INR')
    payment_method = Column(String(50), nullable=True)
    
    # Transaction status
    status = Column(String(50), nullable=False, default='pending')  # pending, captured, failed
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional notes
    notes = Column(Text, nullable=True)


__all__ = ['PaymentTransaction']
