# Order Tracking System - API Response Examples

## 1. GET /orders/{id}/status-history

**Response Body:**

```json
{
  "order_id": 1,
  "order_number": "ORD-2026-000001",
  "current_status": "delivered",
  "status_history": [
    {
      "id": 1,
      "order_id": 1,
      "status": "placed",
      "timestamp": "2026-05-11T11:25:45",
      "notes": "Order created"
    },
    {
      "id": 2,
      "order_id": 1,
      "status": "confirmed",
      "timestamp": "2026-05-11T11:30:00",
      "notes": "Payment verified"
    },
    {
      "id": 3,
      "order_id": 1,
      "status": "packed",
      "timestamp": "2026-05-11T14:15:00",
      "notes": "Packed for shipment"
    },
    {
      "id": 4,
      "order_id": 1,
      "status": "shipped",
      "timestamp": "2026-05-12T09:00:00",
      "notes": "Shipped out"
    },
    {
      "id": 5,
      "order_id": 1,
      "status": "out_for_delivery",
      "timestamp": "2026-05-13T08:30:00",
      "notes": "Out for delivery"
    },
    {
      "id": 6,
      "order_id": 1,
      "status": "delivered",
      "timestamp": "2026-05-13T17:45:00",
      "notes": "Delivered successfully"
    }
  ],
  "total_amount": 999.99,
  "shipping_address": "123 Main St, New Delhi, India 110001",
  "created_at": "2026-05-11T11:25:00"
}
```

## 2. Frontend Timeline Display

### All 6 Status Steps:

1. **Order placed** - 2026-05-11 at 11:25 AM ✓ Completed
2. **Confirmed** - 2026-05-11 at 11:30 AM ✓ Completed
3. **Packed** - 2026-05-11 at 02:15 PM ✓ Completed
4. **Shipped** - 2026-05-12 at 09:00 AM ✓ Completed
5. **Out for delivery** - 2026-05-13 at 08:30 AM ✓ Completed
6. **Delivered** - 2026-05-13 at 05:45 PM ✓ Completed (Current)

### Status Update Flow:

```
Order Placed
    ↓ (PLACED → CONFIRMED)
Confirmed
    ↓ (CONFIRMED → PACKED)
Packed
    ↓ (PACKED → SHIPPED)
Shipped
    ↓ (SHIPPED → OUT_FOR_DELIVERY)
Out for Delivery
    ↓ (OUT_FOR_DELIVERY → DELIVERED)
Delivered
```

## 3. Database Schema

### order_status_history table:

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| order_id | INTEGER | Foreign key to orders table |
| status | VARCHAR(50) | Status value (placed, confirmed, packed, shipped, out_for_delivery, delivered, cancelled) |
| timestamp | DATETIME | When the status change occurred |
| notes | VARCHAR(500) | Optional notes (e.g., "Packed by John", "Admin update") |
| created_at | DATETIME | Record creation time |

### Key Features:

- ✅ Every status change is automatically recorded
- ✅ Includes timestamps for complete audit trail
- ✅ Supports notes for context (e.g., admin updates)
- ✅ Sorted by timestamp for chronological display
- ✅ Works with both automatic and manual (admin) updates

## 4. API Endpoints

### Get Order Tracking:
```
GET /orders/{id}/status-history
Authorization: Bearer {token}
Response: 200 OK
Content-Type: application/json
```

**Headers:**
- Authorization: Bearer {JWT_TOKEN}

**Response:** OrderTrackingResponse with status_history array

### Update Order Status (Admin):
```
PUT /admin/orders/{id}/status
Authorization: Bearer {admin_token}
Body: { "status": "packed" }
Response: 200 OK
```

### Cancel Order (Admin):
```
PUT /admin/orders/{id}/cancel
Authorization: Bearer {admin_token}
Body: { "reason": "Customer requested" }
Response: 200 OK
```

## 5. Status Enum Values

```python
class OrderStatus(Enum):
    PLACED = 'placed'
    CONFIRMED = 'confirmed'
    PACKED = 'packed'
    SHIPPED = 'shipped'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    PAYMENT_PENDING = 'payment_pending'
    FAILED = 'failed'
```

## 6. Frontend Implementation

### Components:
- [OrderTrackingPage.jsx](frontend/src/pages/OrderTrackingPage.jsx) - Main tracking UI
- Service: [order.js](frontend/src/services/order.js) - API functions
- Utils: [orderStatus.js](frontend/src/utils/orderStatus.js) - Status config

### Key Features:
- Shows all 6 main status steps
- Displays date/time for each completed step
- Color-coded progress indicators
- "Pending" status for future steps
- Calculates completion percentage
- Scrollable timeline for mobile
- Responsive grid layout

## 7. Example Usage Flow

### Creating an Order:
1. Order created → Status: PLACED, History: [PLACED]
2. Admin confirms → Status: CONFIRMED, History: [PLACED, CONFIRMED]
3. Admin packs → Status: PACKED, History: [PLACED, CONFIRMED, PACKED]
4. Admin ships → Status: SHIPPED, History: [PLACED, CONFIRMED, PACKED, SHIPPED]
5. Auto update → Status: OUT_FOR_DELIVERY, History: [..., OUT_FOR_DELIVERY]
6. Customer receives → Status: DELIVERED, History: [..., DELIVERED]

### Frontend Tracking Display:
- Each step shows its timestamp from status_history
- Current step highlighted and shows "Currently at this stage"
- Completed steps show checkmark + timestamp
- Pending steps show number + "Pending" text
