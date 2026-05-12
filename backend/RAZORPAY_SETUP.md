# Razorpay Payment Integration - Backend Setup Guide

## Overview
This guide covers the backend implementation of Razorpay payment integration with security best practices for the e-commerce application.

## Security Architecture

### Design Principles
1. **Secret Key Protection**: Razorpay secret key is **NEVER** exposed to frontend
2. **Signature Verification**: All payments verified server-side with HMAC-SHA256
3. **Amount Validation**: Order amount fetched from database, not frontend
4. **Idempotency**: Reuse existing orders to prevent duplicate charges
5. **Audit Trail**: All transactions logged for compliance

## Backend Setup Steps

### Step 1: Install Razorpay SDK

```bash
cd backend
pip install razorpay==1.4.1
```

The requirement has already been added to `requirements.txt`.

### Step 2: Get Razorpay Credentials

1. Go to https://dashboard.razorpay.com/app/keys
2. Create API Keys if not already created
3. Copy **Key ID** (Public Key)
4. Copy **Key Secret** (Secret Key - Keep this safe!)

### Step 3: Configure Environment Variables

Update `.env` file in the backend directory:

```env
# Existing config...
DATABASE_URL=sqlite:///./ecommerce.db
JWT_SECRET_KEY=supersecretkey-change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx  # Replace with your Key ID
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx       # Replace with your Key Secret (KEEP SECRET!)
```

**Important**: Never commit `.env` to version control!

### Step 4: Database Setup

The PaymentTransaction table needs to be created. When you start the FastAPI server, it will automatically create the table:

```bash
python -m uvicorn app.main:app --reload
```

The table schema includes:
- `id` (Primary Key)
- `order_id` (Foreign Key to orders table)
- `razorpay_order_id` (Unique, indexed)
- `razorpay_payment_id` (Unique, indexed)
- `razorpay_signature` (Payment verification)
- `amount` (In paise)
- `currency` (Default: INR)
- `payment_method` (UPI, card, etc.)
- `status` (pending, captured, failed)
- `created_at` / `updated_at` (Timestamps)

## API Endpoints

### 1. Create Payment Order
**Endpoint**: `POST /payment/create-order`

**Authentication**: Required (JWT Token)

**Purpose**: Create a Razorpay order for payment processing

**Flow**:
1. User initiates checkout
2. Frontend calls this endpoint
3. Backend fetches user's pending order
4. Creates Razorpay order with order amount (in paise)
5. Stores transaction record
6. Returns order_id to frontend

**Request Headers**:
```json
{
  "Authorization": "Bearer {JWT_TOKEN}"
}
```

**Response** (200 OK):
```json
{
  "order_id": "order_1234567890abc",
  "amount": 50000,
  "currency": "INR",
  "receipt": "order_123"
}
```

**Error Responses**:
- `404 Not Found`: No pending order for user
- `500 Internal Server Error`: Razorpay API failure

**Security Considerations**:
- Amount is fetched from database, NOT from frontend
- Only authenticated users can create orders
- Order ownership is verified before processing

### 2. Verify Payment
**Endpoint**: `POST /payment/verify`

**Authentication**: Required (JWT Token)

**Purpose**: Verify Razorpay payment signature and confirm payment

**Request Body**:
```json
{
  "payment_id": "pay_1234567890abc",
  "order_id": "order_1234567890abc",
  "signature": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Payment verified successfully",
  "transaction_id": "12345"
}
```

**Failure Response**:
```json
{
  "status": "failure",
  "message": "Invalid payment signature - payment may be tampered"
}
```

**Security Verification Steps**:
1. ✅ Verify HMAC-SHA256 signature using secret key
2. ✅ Fetch transaction record from database
3. ✅ Verify order ownership
4. ✅ Fetch payment details from Razorpay
5. ✅ Verify amount matches order total
6. ✅ Update transaction status
7. ✅ Update order status to confirmed

### 3. Get Transaction Details
**Endpoint**: `GET /payment/transaction/{order_id}`

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "transaction_id": 12345,
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "amount": 50000,
  "currency": "INR",
  "status": "captured",
  "payment_method": "card",
  "created_at": "2024-05-09T10:30:00"
}
```

## Signature Verification - Deep Dive

### Why It's Important
Signature verification is the **most critical security component** because:
1. It proves the payment came from Razorpay (not frontend)
2. It ensures order_id and payment_id weren't tampered with
3. Only the backend with secret key can generate valid signatures

### How It Works
```
Signature Verification Formula:
───────────────────────────────

Data to Sign = "{order_id}|{payment_id}"
Expected Signature = HMAC-SHA256(Data to Sign, Secret Key)
Verification = Compare(Expected Signature, Received Signature)

Example:
───────
Data = "order_9A33XWu590g909|pay_29QQoUBi66xm2f"
Secret Key = "abc123def456"
Generated = HMAC-SHA256("order_9A33XWu590g909|pay_29QQoUBi66xm2f", "abc123def456")
       = "acb6a79e64e0d2fbee5cc6d5c2c3f5e9f8b7d6c5a4b3c2d1e0f9a8b7c6d5e"

If Frontend sends the same signature → Payment is valid
If Frontend sends different signature → Payment is invalid/tampered
```

## Payment Flow Diagram

```
Frontend                    Backend                  Razorpay
   │                           │                          │
   ├──[Click Pay]──────────────┤                          │
   │                           │                          │
   ├──[POST /payment/         │                          │
   │   create-order]──────────▶│                          │
   │                           │                          │
   │                           ├──[Create Order API]─────▶│
   │                           │                          │
   │                           │◀─[Return Order ID]───────┤
   │                           │                          │
   │◀──[Return Order ID]───────┤                          │
   │                           │                          │
   ├──[Open Razorpay Modal]    │                          │
   ├──[Enter Card Details]     │                          │
   ├──[Submit Payment]─────────────────────────────────▶ │
   │                           │                          │
   │                           │                          │
   │◀──[Payment Success]───────────────────────────────── ┤
   │   (payment_id, signature) │                          │
   │                           │                          │
   ├──[POST /payment/verify]──▶│                          │
   │   (payment_id, order_id,  │                          │
   │    signature)             │                          │
   │                           ├──[Verify HMAC]          │
   │                           ├──[Check Amount]         │
   │                           │                          │
   │                           ├──[Fetch Payment Details]─▶
   │                           │                          │
   │                           │◀─[Payment Details]────── ┤
   │                           │                          │
   │◀──[Success Response]──────┤                          │
   │   (transaction_id)        │                          │
   │                           │                          │
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Trusting Frontend Amount
**Wrong**:
```python
# DON'T DO THIS
amount = order_data.get('amount')  # From frontend ✗
razorpay_service.create_order(amount=amount)
```

**Correct**:
```python
# DO THIS
order = db.query(Order).filter(Order.id == order_id).first()
amount = int(order.total_amount * 100)  # From database ✓
razorpay_service.create_order(amount=amount)
```

### ❌ Mistake 2: Skipping Signature Verification
**Wrong**:
```python
# DON'T DO THIS - Frontend can fake this!
if payment_id and order_id:
    order.status = 'paid'  # NO VERIFICATION ✗
```

**Correct**:
```python
# DO THIS
is_valid, msg = razorpay_service.verify_signature(
    order_id, payment_id, signature
)
if is_valid:
    order.status = 'paid'  # VERIFIED ✓
```

### ❌ Mistake 3: Exposing Secret Key
**Wrong**:
```javascript
// FRONTEND - DON'T DO THIS
const secret = 'abc123'  // Secret exposed ✗
```

**Correct**:
```python
# BACKEND ONLY
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')  # ✓
```

### ❌ Mistake 4: No Amount Validation
**Wrong**:
```python
# Frontend says amount is ₹1, but order is ₹100
if signature_valid:
    process_payment()  # Payment processed incorrectly ✗
```

**Correct**:
```python
# Verify amount matches
if payment_amount != order.total_amount * 100:
    raise Exception("Amount mismatch")  # ✓
```

## Testing Razorpay Integration

### 1. Test with Razorpay Test Credentials

Get test credentials from: https://dashboard.razorpay.com/app/keys

**IMPORTANT FOR INDIAN USERS**: Razorpay test mode only accepts **Indian-issued test cards**. International cards will be rejected with "International cards are not supported" error.

### Indian Test Cards (Working in Test Mode):

**Visa (India):**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3 digits (e.g., `123`)
- Name: Any name

**Mastercard (India):**
- Card Number: `5555 5555 5555 4444`
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

**American Express (India):**
- Card Number: `3782 822463 10005`
- Expiry: Any future date
- CVV: Any 4 digits
- Name: Any name

**Why Only Indian Cards Work:**
- Razorpay test environment is configured for Indian market
- Cards are validated based on BIN (first 6 digits)
- International cards trigger geo-blocking in test mode

**If you get "International cards are not supported":**
1. Use the Indian test cards listed above
2. Check if you're using a VPN (may change your location)
3. Verify your Razorpay account is set to Indian region
4. Contact Razorpay support if issues persist

### 2. Verify Razorpay Account Settings

**For Indian Users:**
1. Login to Razorpay Dashboard: https://dashboard.razorpay.com
2. Go to **Settings** → **Account & Settings**
3. Verify **Country** is set to **India**
4. Check **Payment Methods** are enabled for INR
5. Ensure test mode is active (not live mode)

**If account is not configured for India:**
- Contact Razorpay support to change account region
- Create a new account with Indian region selected

### 2. Test API Endpoint

```bash
# Create order
curl -X POST http://localhost:8000/payment/create-order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Verify payment
curl -X POST http://localhost:8000/payment/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_xxx",
    "order_id": "order_xxx",
    "signature": "xxx"
  }'
```

### 3. Test Cases

- [ ] Create order for pending order
- [ ] Verify valid payment signature
- [ ] Reject invalid signature
- [ ] Verify amount validation
- [ ] Test order ownership verification
- [ ] Test idempotency (reuse order)

## Environment-Specific Configuration

### Development
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx  # Test mode
RAZORPAY_KEY_SECRET=xxxxxxx
```

### Production
```env
RAZORPAY_KEY_ID=rzp_live_xxxxx  # Live mode
RAZORPAY_KEY_SECRET=xxxxxxx     # Different secret!
```

**Important**: Always use test credentials during development!

## Files Created/Modified

### New Files:
- `app/schemas/payment.py` - Payment schemas
- `app/models/payment.py` - PaymentTransaction model
- `app/services/razorpay_service.py` - Razorpay service
- `app/api/routers/payment.py` - Payment API endpoints

### Modified Files:
- `requirements.txt` - Added razorpay SDK
- `.env` - Added Razorpay credentials
- `app/main.py` - Registered payment router
- `app/models/order.py` - Added payment relationship

## Next Steps

1. ✅ Backend setup complete
2. ⏭️ Install Razorpay SDK: `pip install -r requirements.txt`
3. ⏭️ Get test credentials from Razorpay dashboard
4. ⏭️ Update `.env` with credentials
5. ⏭️ Start backend server
6. ⏭️ Implement frontend integration

## Support & Troubleshooting

### Razorpay API Failures
Check:
- Credentials are correct
- Test/Live mode matches credentials
- Network connectivity
- Rate limiting (Max 100 requests/sec)

### Signature Verification Fails
Check:
- Secret key is correct
- order_id and payment_id are exact matches
- No whitespace in values
- Using HMAC-SHA256 algorithm

### Database Issues
Check:
- SQLite file permissions
- Database path in DATABASE_URL
- Tables created on server startup

---

**Next**: See `RAZORPAY_FRONTEND_SETUP.md` for frontend implementation
