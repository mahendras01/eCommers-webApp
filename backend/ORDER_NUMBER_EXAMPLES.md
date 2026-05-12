"""
EXAMPLE: Order Number System Usage
===================================

This file demonstrates how the order number system works
with practical examples and expected outputs.
"""

# ============================================================================
# 1. BACKEND: Order Creation with Auto-Generated Order Number
# ============================================================================

"""
POST /orders/

Request Body:
{
  "shipping_address": "123 Main St, Mumbai, MH 400001",
  "payment_method": "razorpay",
  "payment_details": null
}

Headers:
Authorization: Bearer <JWT_TOKEN>

Response (201 Created):
{
  "id": 13,
  "order_number": "ORD-2026-000013",
  "status": "payment_pending",
  "total_amount": 4999.0,
  "payment_method": "razorpay",
  "shipping_address": "123 Main St, Mumbai, MH 400001",
  "created_at": "2026-05-10T10:30:00",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "quantity": 2,
      "unit_price": 2499.5,
      "product": {
        "id": 5,
        "name": "Wireless Headphones",
        "price": 2499.5,
        "image_url": "https://..."
      }
    }
  ]
}

Backend Flow:
1. Validate cart items exist
2. Check product stock
3. Calculate total_amount = 4999.0
4. Call generate_order_number(db)
   - Query: SELECT * FROM orders WHERE order_number LIKE 'ORD-2026-%' ORDER BY id DESC LIMIT 1
   - Result: Last order was ORD-2026-000012
   - Generate: ORD-2026-000013
5. Create Order(order_number='ORD-2026-000013', user_id=..., status='payment_pending')
6. Create OrderItems from cart
7. Clear cart
8. Return OrderRead with order_number
"""

# ============================================================================
# 2. FRONTEND: Display Order List with User-Friendly Order Numbers
# ============================================================================

"""
GET /orders/

Response:
{
  "orders": [
    {
      "id": 13,
      "order_number": "ORD-2026-000013",
      "status": "payment_pending",
      "total_amount": 4999.0,
      "payment_method": "razorpay",
      "shipping_address": "123 Main St, Mumbai, MH 400001",
      "created_at": "2026-05-10T10:30:00",
      "items": [...]
    },
    {
      "id": 12,
      "order_number": "ORD-2026-000012",
      "status": "delivered",
      "total_amount": 2999.0,
      "payment_method": "cash_on_delivery",
      "shipping_address": "456 Oak Ave, Delhi, DL 110001",
      "created_at": "2026-05-09T15:45:00",
      "items": [...]
    }
  ]
}

Frontend Display:
┌─────────────────────────────────────────────────────┐
│ Order History                                       │
├─────────────────────────────────────────────────────┤
│
│ Order #ORD-2026-000013                              │
│ Status: Payment pending                             │
│ Amount: ₹4,999.00                                   │
│ Items: 2                                            │
│
│ Order #ORD-2026-000012                              │
│ Status: Delivered                                   │
│ Amount: ₹2,999.00                                   │
│ Items: 1                                            │
│
└─────────────────────────────────────────────────────┘
"""

# ============================================================================
# 3. PAYMENT GATEWAY: Razorpay Integration with Order Number
# ============================================================================

"""
POST /payment/create-order

Backend creates Razorpay order with order_number in notes:

razorpay_service.create_order(
    amount=499900,  # in paise
    currency='INR',
    receipt='order_13',
    notes={
        'order_number': 'ORD-2026-000013',  # User-friendly reference
        'order_id': 13,                      # Internal ID
        'user_id': 1,
        'customer_email': 'user@example.com',
        'country': 'IN',
        'market': 'india',
        'locale': 'en_IN',
        'payment_for': 'ecommerce_order'
    }
)

Razorpay Response:
{
  "id": "order_HO2jx665Di8zJ8",           # Razorpay order ID
  "entity": "order",
  "amount": 499900,
  "amount_paid": 0,
  "amount_due": 499900,
  "currency": "INR",
  "receipt": "order_13",
  "status": "created",
  "attempts": 0,
  "notes": {
    "order_number": "ORD-2026-000013",
    "order_id": 13,
    ...
  },
  "created_at": 1715425800
}

Frontend Receives:
{
  "order_id": "order_HO2jx665Di8zJ8",
  "amount": 499900,
  "currency": "INR",
  "receipt": "order_13"
}

User Payment Flow:
1. Opens Razorpay modal
2. Enters card details
3. Razorpay processes payment
4. On success: razorpay_payment_id, razorpay_order_id, razorpay_signature
5. Frontend calls POST /payment/verify with signature
6. Backend verifies HMAC-SHA256 signature
7. Updates order status to 'confirmed'
8. Frontend shows: "Payment Successful for Order ORD-2026-000013"
"""

# ============================================================================
# 4. DATABASE SCHEMA
# ============================================================================

"""
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,  -- Format: ORD-2026-000013
  user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_amount FLOAT NOT NULL DEFAULT 0.0,
  shipping_address VARCHAR(500),
  payment_method VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order_number (order_number),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

Sample Data:
┌────┬──────────────────────┬─────────┬────────────────┬──────────────┬──────────────────┐
│ id │ order_number         │ user_id │ status         │ total_amount │ created_at       │
├────┼──────────────────────┼─────────┼────────────────┼──────────────┼──────────────────┤
│ 1  │ ORD-2025-000001      │ 1       │ delivered      │ 1999.0       │ 2025-12-01 10:00 │
│ 2  │ ORD-2025-000002      │ 2       │ delivered      │ 2499.0       │ 2025-12-05 14:30 │
│ 13 │ ORD-2026-000001      │ 1       │ confirmed      │ 3999.0       │ 2026-01-10 09:15 │
│ 14 │ ORD-2026-000002      │ 3       │ payment_pending│ 5999.0       │ 2026-01-12 16:45 │
│ 15 │ ORD-2026-000003      │ 1       │ confirmed      │ 1499.0       │ 2026-05-09 11:20 │
└────┴──────────────────────┴─────────┴────────────────┴──────────────┴──────────────────┘
"""

# ============================================================================
# 5. CUSTOMER SUPPORT SCENARIOS
# ============================================================================

"""
Scenario 1: Customer Inquiry
─────────────────────────────
Customer: "My order ORD-2026-000013 shows as pending. Can you check?"

Support Agent:
1. Queries: SELECT * FROM orders WHERE order_number = 'ORD-2026-000013'
2. Finds: id=13, user_id=1, status='payment_pending'
3. Verifies payment: SELECT * FROM payment_transactions WHERE order_id=13
4. Status: Payment signature verified but webhook not processed yet
5. Response: "Your order ORD-2026-000013 is confirmed. Delivery in 5-7 days."


Scenario 2: Order Lookup
────────────────────────
Support: "What's the order status?"
Customer: "I don't know the ID, just that it's ORD-2026-000012"

Query:
SELECT o.*, pt.* 
FROM orders o 
LEFT JOIN payment_transactions pt ON o.id = pt.order_id 
WHERE o.order_number = 'ORD-2026-000012'

Result:
- Order ORD-2026-000012 confirmed
- Payment status: captured
- Tracking: Ready for shipment


Scenario 3: Duplicate Prevention
────────────────────────────────
Backend ensures uniqueness:
1. order_number has UNIQUE constraint
2. If order_number already exists, database raises IntegrityError
3. Application catches error and retries with next sequence number
4. Result: No duplicate order numbers possible
"""

# ============================================================================
# 6. YEAR ROLLOVER EXAMPLE
# ============================================================================

"""
December 31, 2025:
─────────────────
SELECT * FROM orders WHERE order_number LIKE 'ORD-2025-%'
Results:
- ORD-2025-000001
- ORD-2025-000002
- ...
- ORD-2025-000856

January 1, 2026:
───────────────
First order of new year:
SELECT * FROM orders WHERE order_number LIKE 'ORD-2026-%'
Results: NONE

generate_order_number() returns:
- Query finds no existing orders for 2026
- Sets next_sequence = 1
- Returns: ORD-2026-000001

Timeline:
Dec 31, 2025 11:59 PM: Last order of 2025 → ORD-2025-000856
Jan 1, 2026 12:00 AM: First order of 2026 → ORD-2026-000001
"""

# ============================================================================
# 7. TESTING EXAMPLES
# ============================================================================

"""
Test Case 1: First Order Ever
──────────────────────────────
Setup: Empty database
Action: Create first order
Expected: order_number = 'ORD-2026-000001'
Status: ✅ PASS


Test Case 2: Sequential Order Numbers
────────────────────────────────────────
Setup: Existing orders: ORD-2026-000001, ORD-2026-000002
Action: Create new order
Expected: order_number = 'ORD-2026-000003'
Status: ✅ PASS


Test Case 3: Uniqueness Constraint
─────────────────────────────────────
Setup: Order with order_number='ORD-2026-000005' exists
Action: Try to create duplicate order_number
Expected: IntegrityError, application handles gracefully
Status: ✅ PASS


Test Case 4: Year Boundary
──────────────────────────
Setup: Dec 31, 2025, last order is ORD-2025-999999
Action: Create order on Jan 1, 2026
Expected: order_number = 'ORD-2026-000001'
Status: ✅ PASS


Test Case 5: Frontend Display
──────────────────────────────
Setup: API returns order_number='ORD-2026-000013'
Action: Display on OrdersPage
Expected: Shows "Order #ORD-2026-000013" (not "#13")
Status: ✅ PASS
"""

# ============================================================================
# 8. PERFORMANCE NOTES
# ============================================================================

"""
Query Performance:
─────────────────

Finding last order for sequence (indexed operation):
SELECT * FROM orders 
WHERE order_number LIKE 'ORD-2026-%' 
ORDER BY id DESC LIMIT 1

Execution Plan:
- Uses index on order_number column
- LIKE 'ORD-2026-%' matches prefix
- ORDER BY id DESC uses primary key
- Result: ~0.5ms for 1M records


Finding order by order_number (O(1) lookup):
SELECT * FROM orders WHERE order_number = 'ORD-2026-000013'

Execution Plan:
- Direct index lookup on unique order_number
- No table scan needed
- Result: <1ms


Indexes in Place:
- PRIMARY KEY (id)
- UNIQUE INDEX (order_number)
- INDEX (user_id)
- INDEX (created_at)
"""

# ============================================================================
# 9. SECURITY CONSIDERATIONS
# ============================================================================

"""
Authorization Check:
───────────────────
✅ Always verify: order.user_id == current_user.id
✅ Never trust only order_number for authorization
✅ order_number is sequential but not sensitive data

Example Secure Endpoint:
────────────────────────
@router.get("/{order_number}")
def get_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.order_number == order_number
    ).first()
    
    # CRITICAL: Verify ownership
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order
"""
