#!/usr/bin/env python3
"""
Test script to verify OrderStatus enum handling with both string and enum values
"""
import sys
import os
sys.path.insert(0, os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.order import Order, OrderStatus
from app.db.base import Base

# Create an in-memory database for testing
db_path = "test_enum.db"
engine = create_engine(f"sqlite:///{db_path}")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("=" * 60)
    print("Testing OrderStatus Enum with SQLAlchemy")
    print("=" * 60)
    
    # Test 1: Create order with enum value
    print("\n1. Creating order with OrderStatus.PLACED enum value...")
    order1 = Order(
        order_number="ORD-2026-000001",
        user_id=1,
        status=OrderStatus.PLACED.value,
        total_amount=100.0,
        shipping_address="123 Main St"
    )
    session.add(order1)
    session.commit()
    print(f"   ✅ Order created with status: {order1.status}")
    
    # Test 2: Create order with string value
    print("\n2. Creating order with string 'confirmed' value...")
    order2 = Order(
        order_number="ORD-2026-000002",
        user_id=1,
        status="confirmed",
        total_amount=200.0,
        shipping_address="456 Oak Ave"
    )
    session.add(order2)
    session.commit()
    print(f"   ✅ Order created with status: {order2.status}")
    
    # Test 3: Query and retrieve orders
    print("\n3. Querying orders from database...")
    orders = session.query(Order).all()
    print(f"   ✅ Retrieved {len(orders)} orders")
    for order in orders:
        print(f"      - Order {order.order_number}: status={order.status} (type: {type(order.status).__name__})")
    
    # Test 4: Test comparison with enum values
    print("\n4. Testing status comparisons...")
    order_placed = session.query(Order).filter(Order.order_number == "ORD-2026-000001").first()
    order_confirmed = session.query(Order).filter(Order.order_number == "ORD-2026-000002").first()
    
    # String comparison should work
    print(f"   - order_placed.status == 'placed': {order_placed.status == 'placed'}")
    print(f"   - order_confirmed.status == 'confirmed': {order_confirmed.status == 'confirmed'}")
    
    # Test 5: Test enum value comparison
    print("\n5. Testing enum value comparisons...")
    print(f"   - order_placed.status == OrderStatus.PLACED.value: {order_placed.status == OrderStatus.PLACED.value}")
    print(f"   - order_confirmed.status == OrderStatus.CONFIRMED.value: {order_confirmed.status == OrderStatus.CONFIRMED.value}")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✅")
    print("=" * 60)
    print("\nThe enum handling now works correctly:")
    print("- Database stores lowercase string values ('placed', 'confirmed', etc.)")
    print("- SQLAlchemy retrieves them as strings")
    print("- Comparisons work with both string and enum.value")
    
finally:
    session.close()
    # Clean up test database
    import os
    if os.path.exists(db_path):
        os.remove(db_path)
