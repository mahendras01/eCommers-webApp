#!/usr/bin/env python3
"""
Test script to verify the order status enum fix works end-to-end
"""
import sys
import os
sys.path.insert(0, os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.order import Order, OrderStatus, OrderItem
from app.models.product import Product
from app.models.user import User
from app.db.base import Base
from app.services.order_service import is_order_cancellable, cancel_order
from datetime import datetime

# Create a test database
db_path = "test_order_flow.db"
engine = create_engine(f"sqlite:///{db_path}")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("=" * 70)
    print("Order Status Enum Fix - Comprehensive Test")
    print("=" * 70)
    
    # Create test data
    print("\n1. Creating test user...")
    user = User(
        email="test@example.com",
        hashed_password="test_hash",
        name="Test User"
    )
    session.add(user)
    session.commit()
    print(f"   ✅ User created with ID: {user.id}")
    
    # Create test product
    print("\n2. Creating test product...")
    product = Product(
        name="Test Product",
        description="A test product for order testing",
        price=100.0,
        stock=10,
        image_url="https://example.com/image.jpg"
    )
    session.add(product)
    session.commit()
    print(f"   ✅ Product created with ID: {product.id}")
    
    # Test creating orders with different enum values
    print("\n3. Creating orders with different status values...")
    
    # Order 1: Using OrderStatus enum
    order1 = Order(
        order_number="ORD-2026-000001",
        user_id=user.id,
        status=OrderStatus.PLACED,
        total_amount=100.0,
        shipping_address="123 Main St"
    )
    session.add(order1)
    
    # Order 2: Direct enum assignment
    order2 = Order(
        order_number="ORD-2026-000002",
        user_id=user.id,
        status=OrderStatus.CONFIRMED,
        total_amount=200.0,
        shipping_address="456 Oak Ave"
    )
    session.add(order2)
    
    # Order 3: Payment pending status
    order3 = Order(
        order_number="ORD-2026-000003",
        user_id=user.id,
        status=OrderStatus.PAYMENT_PENDING,
        total_amount=150.0,
        shipping_address="789 Pine Rd"
    )
    session.add(order3)
    
    session.commit()
    print(f"   ✅ Created 3 orders")
    
    # Test retrieving orders
    print("\n4. Retrieving orders from database...")
    orders = session.query(Order).all()
    print(f"   ✅ Retrieved {len(orders)} orders")
    for order in orders:
        print(f"      - {order.order_number}: status={order.status} (type: {type(order.status).__name__})")
    
    # Test enum comparisons
    print("\n5. Testing status comparisons with enum members...")
    test_order = session.query(Order).filter(Order.order_number == "ORD-2026-000001").first()
    
    assert test_order.status == OrderStatus.PLACED, "Status comparison failed"
    print(f"   ✅ order.status == OrderStatus.PLACED: {test_order.status == OrderStatus.PLACED}")
    
    assert test_order.status != OrderStatus.CONFIRMED, "Status comparison failed"
    print(f"   ✅ order.status != OrderStatus.CONFIRMED: {test_order.status != OrderStatus.CONFIRMED}")
    
    # Test status update
    print("\n6. Testing status update...")
    test_order.status = OrderStatus.SHIPPED
    session.commit()
    session.refresh(test_order)
    assert test_order.status == OrderStatus.SHIPPED, "Status update failed"
    print(f"   ✅ Updated status to: {test_order.status}")
    
    # Test is_order_cancellable function
    print("\n7. Testing is_order_cancellable function...")
    cancellable_order = session.query(Order).filter(Order.order_number == "ORD-2026-000002").first()
    assert is_order_cancellable(cancellable_order), "Order should be cancellable"
    print(f"   ✅ Confirmed order is cancellable: {is_order_cancellable(cancellable_order)}")
    
    payment_pending = session.query(Order).filter(Order.order_number == "ORD-2026-000003").first()
    assert is_order_cancellable(payment_pending), "Payment pending order should be cancellable"
    print(f"   ✅ Payment pending order is cancellable: {is_order_cancellable(payment_pending)}")
    
    shipped_order = session.query(Order).filter(Order.order_number == "ORD-2026-000001").first()
    assert not is_order_cancellable(shipped_order), "Shipped order should not be cancellable"
    print(f"   ✅ Shipped order is not cancellable: {not is_order_cancellable(shipped_order)}")
    
    # Test cancel_order function
    print("\n8. Testing cancel_order function...")
    cancel_order(cancellable_order, reason="Customer requested")
    session.commit()
    session.refresh(cancellable_order)
    assert cancellable_order.status == OrderStatus.CANCELLED, "Cancel failed"
    assert cancellable_order.cancel_reason == "Customer requested", "Cancel reason not set"
    print(f"   ✅ Order cancelled successfully")
    print(f"      - Status: {cancellable_order.status}")
    print(f"      - Reason: {cancellable_order.cancel_reason}")
    
    print("\n" + "=" * 70)
    print("All tests passed! ✅")
    print("=" * 70)
    print("\nSummary:")
    print("- Order status enum is properly handled by SQLAlchemy")
    print("- Enum members are returned from database queries")
    print("- Status comparisons work correctly with enum members")
    print("- Order service functions work correctly with enum values")
    print("- No KeyError or LookupError occurs when retrieving orders")
    
finally:
    session.close()
    # Clean up test database
    if os.path.exists(db_path):
        os.remove(db_path)
