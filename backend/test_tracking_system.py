"""
Test script for order tracking system with status history
Run: python test_tracking_system.py
"""
from datetime import datetime
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.product import Product, Category, SubCategory
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus
from app.services.order_service import generate_order_number, record_status_change, get_order_tracking
from app.services.auth import hash_password

# Create tables
Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    print("=" * 60)
    print("ORDER TRACKING SYSTEM TEST")
    print("=" * 60)
    
    # Clean up previous test data
    db.query(OrderStatusHistory).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.query(SubCategory).delete()
    db.query(User).delete()
    db.commit()
    print("\n✓ Cleaned up previous test data")
    
    # Create test user
    test_user = User(
        name="Test User",
        email="test@tracking.com",
        hashed_password=hash_password("password123"),
        role="user"
    )
    db.add(test_user)
    db.commit()
    print("✓ Created test user:", test_user.email)
    
    # Create test category and subcategory
    category = Category(name="Electronics")
    db.add(category)
    db.flush()
    
    subcategory = SubCategory(
        category_id=category.id,
        name="Phones"
    )
    db.add(subcategory)
    db.commit()
    print("✓ Created category and subcategory")
    
    # Create test product
    product = Product(
        name="Test Product",
        description="Test product for tracking",
        price=999.99,
        category_id=category.id,
        subcategory_id=subcategory.id,
        stock=10,
        tax_percent=18.0
    )
    db.add(product)
    db.commit()
    print("✓ Created test product")
    
    # Create test order
    order_number = generate_order_number(db)
    order = Order(
        order_number=order_number,
        user_id=test_user.id,
        status=OrderStatus.PLACED.value,
        total_amount=999.99,
        shipping_address="123 Test St",
        payment_method="cash_on_delivery"
    )
    db.add(order)
    db.flush()
    
    # Create order item
    order_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=1,
        unit_price=999.99
    )
    db.add(order_item)
    db.commit()
    print("\n✓ Created test order:", order_number)
    
    # Record initial status
    record_status_change(db, order, OrderStatus.PLACED.value, "Order created")
    print("✓ Recorded status: PLACED")
    db.commit()
    
    # Simulate status progression
    statuses = [
        (OrderStatus.CONFIRMED.value, "Payment verified"),
        (OrderStatus.PACKED.value, "Packed for shipment"),
        (OrderStatus.SHIPPED.value, "Shipped out"),
        (OrderStatus.OUT_FOR_DELIVERY.value, "Out for delivery"),
        (OrderStatus.DELIVERED.value, "Delivered successfully")
    ]
    
    for status, notes in statuses:
        order.status = status
        record_status_change(db, order, status, notes)
        print(f"✓ Recorded status: {status.upper()}")
        db.commit()
    
    # Retrieve tracking data
    print("\n" + "=" * 60)
    print("TRACKING DATA")
    print("=" * 60)
    
    tracking_data = get_order_tracking(db, order.id)
    
    print(f"\nOrder Number: {tracking_data['order_number']}")
    print(f"Current Status: {tracking_data['current_status']}")
    print(f"Total Amount: ₹{tracking_data['total_amount']:.2f}")
    print(f"Shipping Address: {tracking_data['shipping_address']}")
    print(f"\nStatus History ({len(tracking_data['status_history'])} entries):")
    print("-" * 60)
    
    for idx, history in enumerate(tracking_data['status_history'], 1):
        timestamp = history.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        print(f"{idx}. {history.status.upper()}")
        print(f"   Timestamp: {timestamp}")
        if history.notes:
            print(f"   Notes: {history.notes}")
    
    # Verify all statuses are present
    recorded_statuses = {h.status for h in tracking_data['status_history']}
    expected_statuses = {'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'}
    
    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)
    
    if recorded_statuses == expected_statuses:
        print("✅ All expected statuses recorded correctly!")
    else:
        print("❌ Status mismatch:")
        print(f"  Expected: {expected_statuses}")
        print(f"  Got: {recorded_statuses}")
    
    print(f"\n✅ Order tracking test completed successfully!")
    print(f"   Order ID: {order.id}")
    print(f"   Order Number: {order_number}")
    print(f"   Final Status: {order.status}")
    
except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
