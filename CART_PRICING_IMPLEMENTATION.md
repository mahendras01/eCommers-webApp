# Cart Pricing System - Implementation Summary

## Overview
This document outlines the complete cart pricing system implementation with tax and shipping calculations.

---

## 1. BACKEND IMPLEMENTATION

### A. Database Schema Changes

**Added column to `Product` model:**
```python
tax_percent = Column(Float, nullable=False, default=18.0)  # GST percentage
```

**Default tax percentage:** 18% (standard GST in India)

---

### B. API Endpoint: `POST /cart/calculate/pricing`

**Request:** 
- Requires authenticated user (JWT token in Authorization header)
- No request body needed (uses current user's cart)

**Response Schema:**
```json
{
  "subtotal": 400.00,
  "tax": 46.00,
  "tax_breakdown": {
    "18.0": 36.00,
    "5.0": 10.00
  },
  "shipping": 100.00,
  "total": 546.00,
  "items_count": 3
}
```

**Example Calculation (from tests):**
```
Cart Items:
  - Product 1: ₹100 × 2 (18% tax) = ₹200
  - Product 2: ₹200 × 1 (5% tax) = ₹200
  
Calculation:
  Subtotal = ₹100 × 2 + ₹200 × 1 = ₹400
  Tax (18%) = ₹200 × 0.18 = ₹36
  Tax (5%)  = ₹200 × 0.05 = ₹10
  Total Tax = ₹46
  Shipping = ₹100 (flat rate)
  TOTAL = ₹400 + ₹46 + ₹100 = ₹546
```

---

### C. Service Layer: `app/services/cart_service.py`

**Key Functions:**

1. **`calculate_cart_pricing(db: Session, user: User) -> dict`**
   - Calculates pricing for authenticated user's cart
   - Queries CartItems from database
   - Returns detailed pricing breakdown

2. **`calculate_pricing_for_items(db: Session, items: list[dict]) -> dict`**
   - Calculates pricing for arbitrary list of items
   - Used for guest cart estimation
   - Items format: `[{'product_id': 1, 'quantity': 2}, ...]`

**Configuration:**
```python
FLAT_SHIPPING_COST = 100.0  # ₹100 flat rate
DEFAULT_TAX_PERCENT = 18.0  # 18% GST default
```

---

### D. Schemas Updated

**ProductCreate/ProductUpdate/ProductRead:**
- Added `tax_percent` field (float, range 0-100, default 18)

**ProductInCart:**
- Added `tax_percent` field for frontend calculations

**CartCalculationResponse:**
```python
class CartCalculationResponse(BaseModel):
    subtotal: float
    tax: float
    tax_breakdown: dict  # e.g., {"18.0": 36.00, "5.0": 10.00}
    shipping: float
    total: float
    items_count: int
```

---

## 2. FRONTEND IMPLEMENTATION

### A. CartContext Updates

**New state property:**
```javascript
const [pricing, setPricing] = useState({
  subtotal: 0,
  tax: 0,
  tax_breakdown: {},
  shipping: 100,
  total: 100,
  items_count: 0,
});
```

**Local calculation for guest carts:**
```javascript
function calculateGuestCartPricing(items) {
  // Uses same logic as backend for consistency
  // Calculates subtotal, tax (by rate), shipping, total
  // Returns: { subtotal, tax, tax_breakdown, shipping, total, items_count }
}
```

**Backend fetch for authenticated users:**
```javascript
const pricingResponse = await api.post('/cart/calculate/pricing');
setPricing(pricingResponse.data);
```

---

### B. CartPage Updates

**Display breakdown:**
```jsx
<div className="flex justify-between text-slate-600">
  <span>Subtotal ({pricing.items_count} items)</span>
  <span>₹{pricing.subtotal.toFixed(2)}</span>
</div>

{/* Tax Breakdown by Rate */}
{Object.entries(pricing.tax_breakdown).map(([rate, amount]) => (
  <div key={rate} className="flex justify-between text-slate-600">
    <span>Tax ({rate}%)</span>
    <span>₹{amount.toFixed(2)}</span>
  </div>
))}

<div className="flex justify-between text-slate-600">
  <span>Shipping</span>
  <span>₹{pricing.shipping.toFixed(2)}</span>
</div>

<div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold">
  <span>Total</span>
  <span>₹{pricing.total.toFixed(2)}</span>
</div>
```

**Removed:**
- "Calculated at checkout" placeholder text
- Manual total calculation (now comes from backend)

---

### C. ProductPage Updates

**Tax information display:**
```jsx
<div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
  <p className="font-medium">Additional costs at checkout:</p>
  <p>• Tax ({product.tax_percent}%) will be added</p>
  <p>• Shipping: ₹100 flat rate</p>
</div>
```

---

## 3. CONSISTENCY ACROSS PAGES

**Backend is single source of truth:**
- All calculations happen on server
- Frontend receives calculated values
- Guest cart uses same logic locally before checkout

**Calculation used in:**
1. **Cart Page** - Displays breakdown before checkout
2. **Product Page** - Shows tax percentage for transparency
3. **Checkout** - Uses same endpoint to finalize prices
4. **Order Confirmation** - References same calculation

---

## 4. API USAGE EXAMPLES

### Get Cart with Pricing
```bash
# Get cart items
GET /cart/
Authorization: Bearer <token>

Response:
{
  "items": [...],
  "total_items": 3,
  "total_price": 400.00
}
```

### Calculate Cart Pricing
```bash
# Get detailed pricing breakdown
POST /cart/calculate/pricing
Authorization: Bearer <token>

Response:
{
  "subtotal": 400.00,
  "tax": 46.00,
  "tax_breakdown": {
    "18.0": 36.00,
    "5.0": 10.00
  },
  "shipping": 100.00,
  "total": 546.00,
  "items_count": 3
}
```

---

## 5. CONFIGURATION OPTIONS

**To change shipping cost:**
- Edit `FLAT_SHIPPING_COST` in `backend/app/services/cart_service.py`
- Update `FLAT_SHIPPING_COST` in `frontend/src/contexts/CartContext.jsx`

**To change default tax rate:**
- Edit Product's `tax_percent` default value in `backend/app/models/product.py`
- Update `DEFAULT_TAX_PERCENT` in `frontend/src/contexts/CartContext.jsx`

**To use category-based tax rates:**
- Add `tax_percent` field to Category model
- Update service to use category tax instead of product tax
- Modify calculation logic accordingly

---

## 6. TESTING

**Test files created:**
- `test_cart_pricing.py` - Service layer calculation tests
- `test_api_cart_pricing.py` - Integration tests

**Run tests:**
```bash
python test_cart_pricing.py
python test_api_cart_pricing.py
```

---

## 7. MIGRATION NOTES

**Database changes:**
- Old database needs migration or deletion
- On next startup, new `tax_percent` column will be created
- Existing products get default 18% tax rate

**Frontend changes:**
- CartContext now provides `pricing` object
- CartPage displays pricing breakdown
- No breaking changes for other pages

---

## 8. FUTURE ENHANCEMENTS

**Possible improvements:**
- Dynamic shipping based on weight/distance
- Promotional discounts
- Category-specific tax rates
- Tiered pricing (bulk discounts)
- Regional tax variations
- Payment gateway integration with dynamic tax calculation
