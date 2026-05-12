#!/usr/bin/env python3
"""
Test script to verify cart pricing calculations.
"""
import sys
sys.path.insert(0, '/Users/mahendrasahu/Documents/python/eCommers-webApp/backend')

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.product import Product, Category
from app.services.cart_service import calculate_pricing_for_items

# Create tables
Base.metadata.create_all(bind=engine)

# Get a database session
db = SessionLocal()

try:
    # Create test category and product
    category = Category(name="Test Category")
    db.add(category)
    db.flush()  # Flush to get the ID
    
    # Create products with different tax rates
    product1 = Product(
        name="Product 1 (18% GST)",
        description="Test product 1",
        price=100.0,
        stock=10,
        tax_percent=18.0,
        category_id=category.id
    )
    
    product2 = Product(
        name="Product 2 (5% GST)",
        description="Test product 2",
        price=200.0,
        stock=10,
        tax_percent=5.0,
        category_id=category.id
    )
    
    db.add(product1)
    db.add(product2)
    db.commit()
    db.refresh(product1)
    db.refresh(product2)
    
    # Test calculation for guest cart
    items = [
        {'product_id': product1.id, 'quantity': 2},
        {'product_id': product2.id, 'quantity': 1}
    ]
    
    result = calculate_pricing_for_items(db, items)
    
    print("=" * 60)
    print("CART PRICING CALCULATION TEST")
    print("=" * 60)
    print(f"\nTest Items:")
    print(f"  Product 1: ₹{product1.price} × 2 (18% GST)")
    print(f"  Product 2: ₹{product2.price} × 1 (5% GST)")
    print(f"\nCalculation Results:")
    print(f"  Subtotal:        ₹{result['subtotal']:.2f}")
    print(f"  Tax (18%):       ₹{result['tax_breakdown'].get('18.0', 0):.2f}")
    print(f"  Tax (5%):        ₹{result['tax_breakdown'].get('5.0', 0):.2f}")
    print(f"  Total Tax:       ₹{result['tax']:.2f}")
    print(f"  Shipping:        ₹{result['shipping']:.2f}")
    print(f"  TOTAL:           ₹{result['total']:.2f}")
    print(f"  Items Count:     {result['items_count']}")
    
    # Verify calculations
    expected_subtotal = (100 * 2) + (200 * 1)  # 400
    expected_tax_18 = 100 * 2 * 0.18  # 36
    expected_tax_5 = 200 * 1 * 0.05   # 10
    expected_tax_total = expected_tax_18 + expected_tax_5  # 46
    expected_shipping = 100
    expected_total = expected_subtotal + expected_tax_total + expected_shipping  # 546
    
    print(f"\n" + "=" * 60)
    print("VERIFICATION:")
    print("=" * 60)
    
    checks = [
        ("Subtotal", result['subtotal'], expected_subtotal),
        ("Tax Total", result['tax'], expected_tax_total),
        ("Total", result['total'], expected_total),
    ]
    
    all_passed = True
    for check_name, actual, expected in checks:
        status = "✓" if abs(actual - expected) < 0.01 else "✗"
        print(f"{status} {check_name}: {actual:.2f} (expected: {expected:.2f})")
        if abs(actual - expected) >= 0.01:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed!")
        sys.exit(1)

finally:
    db.close()
