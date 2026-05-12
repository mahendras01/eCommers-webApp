// Order Number Reference System - Best Practices & Implementation

## Overview
The order number system provides user-friendly order references that are easy to read, remember, and share.

## Format
- **Pattern**: `ORD-YYYY-XXXXXX`
  - `ORD`: Static prefix for all orders
  - `YYYY`: Current year (e.g., 2026)
  - `XXXXXX`: Sequential 6-digit number (zero-padded)

## Examples
```
ORD-2026-000001  (First order of 2026)
ORD-2026-000002  (Second order of 2026)
ORD-2026-000013  (13th order of 2026)
ORD-2025-000001  (First order of 2025)
```

## Database Structure

### Order Model Changes
```python
class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)              # Internal DB ID (not shown to users)
    order_number = Column(String(50), unique=True)      # User-friendly reference (ORD-2026-000001)
    user_id = Column(Integer, ForeignKey('users.id'))
    # ... other fields
```

### Key Properties
- **order_number**: String, unique, indexed
- **Generated**: At order creation time
- **Format**: Annual sequence reset each year
- **Persistence**: Stored in database permanently

## Implementation Details

### 1. Order Number Generation (`order_service.py`)
```python
def generate_order_number(db: Session) -> str:
    current_year = datetime.utcnow().year
    
    # Find last order of current year
    last_order = db.query(Order).filter(
        Order.order_number.like(f'ORD-{current_year}-%')
    ).order_by(Order.id.desc()).first()
    
    # Calculate next sequence
    next_sequence = (int(last_order.order_number.split('-')[-1]) + 1) if last_order else 1
    
    return f'ORD-{current_year}-{next_sequence:06d}'
```

### 2. Order Creation Flow
```
1. User clicks "Place Order"
2. Backend receives order data
3. validate order data (cart items, address, payment method)
4. Calculate total amount from database
5. Generate unique order_number using generate_order_number()
6. Create Order with order_number
7. Create OrderItems from cart
8. Clear cart
9. Return OrderRead response (includes order_number)
```

### 3. API Response Example
```json
{
  "order_number": "ORD-2026-000013",
  "id": 13,
  "status": "payment_pending",
  "total_amount": 4999.0,
  "payment_method": "razorpay",
  "shipping_address": "123 Main St, City, State 12345",
  "created_at": "2026-05-10T10:30:00",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "quantity": 2,
      "unit_price": 2499.5,
      "product": {
        "id": 5,
        "name": "Product Name",
        "price": 2499.5,
        "image_url": "https://..."
      }
    }
  ]
}
```

## Frontend Display

### OrdersPage.jsx
```jsx
<p className="text-xs font-semibold uppercase text-slate-500">Order Number</p>
<p className="text-lg font-bold text-slate-900">{order.order_number}</p>
```

### Display Locations
- Order listing page (OrdersPage)
- Order detail pages
- Order confirmation emails
- Customer support communications

## Migration for Existing Orders

### Automatic Migration
For existing orders in the database, run the migration script:

```bash
cd backend
python scripts/migrate_order_numbers.py
```

### What It Does
1. Queries all orders without order_number
2. Groups by creation year
3. Assigns sequential numbers: ORD-YYYY-000001, ORD-YYYY-000002, etc.
4. Updates database in batch

### Example Output
```
📦 Found 5 orders without order_number
🔄 Starting migration...

Processing 3 orders from 2025...
  ✓ Order ID 1 → ORD-2025-000001
  ✓ Order ID 2 → ORD-2025-000002
  ✓ Order ID 3 → ORD-2025-000003

Processing 2 orders from 2026...
  ✓ Order ID 4 → ORD-2026-000001
  ✓ Order ID 5 → ORD-2026-000002

✅ Migration complete! Updated 5 orders.
```

## Benefits

### For Users
✅ Easy to remember and share order references
✅ Clear annual segmentation
✅ Professional appearance
✅ No confusion with internal database IDs

### For Business
✅ Better customer communications
✅ Support ticket organization
✅ Marketing tracking
✅ Segment analysis by year

### For Developers
✅ Keep internal ID private
✅ User-friendly external identifier
✅ Unique constraint ensures no duplicates
✅ Year-based partitioning ready for scaling

## Database ID vs Order Number

### Database ID (Internal)
- Used: Backend only, admin debugging
- Format: Auto-increment integer (1, 2, 3...)
- Visibility: Not shown to users
- Purpose: Internal database reference

### Order Number (User-Facing)
- Used: Customer communications, emails, tracking
- Format: ORD-2026-000013
- Visibility: Displayed on UI and emails
- Purpose: Customer-friendly reference

## Example: Full Order Lifecycle

```
1. USER PLACES ORDER
   POST /orders/
   → order_number = ORD-2026-000013 (auto-generated)
   → id = 13 (auto-increment)

2. USER VIEWS ORDERS
   GET /orders/
   → Display: "Order #ORD-2026-000013"
   → Internally: Order.id = 13

3. CONFIRMATION EMAIL
   Subject: "Order ORD-2026-000013 Confirmed"
   Body: "Your order ORD-2026-000013 for ₹4,999"

4. PAYMENT VERIFICATION
   POST /payment/verify
   → order_id lookup: id = 13
   → User sees: "ORD-2026-000013 Payment Successful"

5. CUSTOMER SUPPORT
   Customer says: "My order ORD-2026-000013 hasn't shipped"
   Support looks up: ORDER WHERE order_number = 'ORD-2026-000013'
   → Instantly finds internal order (id=13)
```

## Scaling Considerations

### Current Approach (Annual Reset)
- ✅ Compact: 6 digits per year
- ✅ Manageable: Up to 999,999 orders/year
- ✅ Clear: Users see year information
- ⚠️ Becomes: ORD-2026-999999 after 999,999 orders in 2026

### Future Options (if needed)
1. **Continuous counter**: ORD-000000001, ORD-000000002 (ever-increasing)
2. **Month segmentation**: ORD-202605-00001 (year-month-sequence)
3. **User prefix**: ORD-USR123-00001 (includes user ID)
4. **Hash-based**: ORD-A3F2D1E4C5 (uses hash of order data)

## Testing Checklist

- [ ] Order creation generates correct format
- [ ] Order numbers are unique across all users
- [ ] Format follows ORD-YYYY-XXXXXX pattern
- [ ] Sequence increments correctly year to year
- [ ] Existing orders migrated successfully
- [ ] Frontend displays order_number instead of id
- [ ] API returns order_number in response
- [ ] Database indexes work for quick lookups
- [ ] Year rollover works correctly (2025 → 2026)

## Common Queries

### Find Order by Order Number
```python
order = db.query(Order).filter(Order.order_number == 'ORD-2026-000013').first()
```

### Get User's Orders with Numbers
```python
orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
# All will have order_number field
```

### Count Orders in Year
```python
orders_2026 = db.query(Order).filter(Order.order_number.like('ORD-2026-%')).count()
```

## Security Implications

- ✅ Order numbers are unique but sequential (predictable)
- ✅ Cannot predict other users' order numbers (user_id is separate)
- ✅ Always verify order ownership: `order.user_id == current_user.id`
- ⚠️ Don't rely solely on order_number for authorization
- ✅ Use JWT + order ownership verification for API access

## Support & Documentation

For questions or issues:
1. Check migration script output
2. Verify order_number uniqueness constraint in database
3. Check database has order_number column for all orders
4. Ensure OrderRead schema includes order_number field
