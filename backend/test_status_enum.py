#!/usr/bin/env python3
"""
Test script to verify OrderStatus enum usage throughout the system
"""
import sys
from app.models.order import OrderStatus
from app.schemas.order import OrderStatusUpdate
from pydantic import ValidationError

print("=" * 60)
print("Testing OrderStatus Enum Implementation")
print("=" * 60)

# Test 1: Check OrderStatus enum values
print("\n1. OrderStatus Enum Values:")
for status in OrderStatus:
    print(f"   - {status.name} = '{status.value}'")

# Test 2: Check that invalid status is rejected by validator
print("\n2. Testing OrderStatusUpdate Validator:")
print("   - Testing invalid status 'Coformed'...")
try:
    update = OrderStatusUpdate(status='Coformed')
    print("     ❌ FAILED: Validator allowed invalid status 'Coformed'")
    sys.exit(1)
except ValidationError as e:
    print("     ✅ PASSED: Validator rejected 'Coformed'")
    print(f"     Error: {e.errors()[0]['msg']}")

# Test 3: Check that valid statuses are accepted
print("\n3. Testing Valid Status Values:")
valid_statuses = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'payment_pending', 'failed']
for status_str in valid_statuses:
    try:
        update = OrderStatusUpdate(status=status_str)
        print(f"   ✅ '{status_str}' accepted")
    except ValidationError as e:
        print(f"   ❌ '{status_str}' rejected: {e.errors()[0]['msg']}")
        sys.exit(1)

# Test 4: Check enum comparison
print("\n4. Testing Enum Comparisons:")
print(f"   - OrderStatus.CONFIRMED == OrderStatus.CONFIRMED: {OrderStatus.CONFIRMED == OrderStatus.CONFIRMED}")
print(f"   - OrderStatus.CONFIRMED == 'confirmed': {OrderStatus.CONFIRMED == 'confirmed'} (should be False)")
print(f"   - OrderStatus.CONFIRMED.value == 'confirmed': {OrderStatus.CONFIRMED.value == 'confirmed'}")

print("\n" + "=" * 60)
print("All tests passed! ✅")
print("=" * 60)
