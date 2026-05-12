# Shipment System - Quick Reference & Examples

## Setup & Verification

### 1. Verify Models Compile
```bash
cd backend
python -c "from app.main import app; print('✓ App imported successfully')"
```

### 2. Create Admin User (if needed)
```bash
python create_admin.py
```

### 3. Start Server
```bash
export PYTHONPATH=/Users/mahendrasahu/Documents/python/eCommers-webApp/backend
./venv/bin/python -m uvicorn app.main:app --reload
```

---

## API Examples with cURL

### Authentication

**Login as Admin:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@test.com",
    "password": "StrongAdminP@ss1"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

### Admin Shipment Management

#### Create Shipment
```bash
curl -X POST http://localhost:8000/admin/shipments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "courier_name": "DHL Express",
    "estimated_delivery_date": "2026-05-25T10:00:00Z",
    "notes": "Handle with care - fragile items"
  }'
```

#### Update Shipment Status - Packed
```bash
curl -X PUT http://localhost:8000/admin/shipments/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "packed",
    "location": "Warehouse A, Building 3",
    "description": "Order packed into box #12345"
  }'
```

#### Update Shipment Status - Shipped
```bash
curl -X PUT http://localhost:8000/admin/shipments/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "location": "Chicago Distribution Hub",
    "description": "Package collected by courier, tracking with DHL"
  }'
```

#### Update Shipment Status - In Transit
```bash
curl -X PUT http://localhost:8000/admin/shipments/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_transit",
    "location": "Regional Hub - Indianapolis",
    "description": "Package in transit to destination city"
  }'
```

#### Update Shipment Status - Out For Delivery
```bash
curl -X PUT http://localhost:8000/admin/shipments/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "out_for_delivery",
    "location": "Local Delivery Center",
    "description": "Package out for delivery today"
  }'
```

#### Update Shipment Status - Delivered
```bash
curl -X PUT http://localhost:8000/admin/shipments/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "location": "Customer Address",
    "description": "Package delivered successfully and signed"
  }'
```

#### List All Shipments
```bash
curl -X GET "http://localhost:8000/admin/shipments?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Get Specific Shipment
```bash
curl -X GET http://localhost:8000/admin/shipments/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### User Tracking

#### Get Tracking for Your Order
```bash
curl -X GET http://localhost:8000/orders/1/tracking \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Response Example:**
```json
{
  "shipment": {
    "id": 1,
    "order_id": 1,
    "tracking_number": "SHIP-A1B2C3D4E5F6",
    "courier_name": "DHL Express",
    "status": "in_transit",
    "estimated_delivery_date": "2026-05-25T10:00:00Z",
    "shipped_at": "2026-05-20T08:45:00Z",
    "delivered_at": null,
    "created_at": "2026-05-18T14:30:00Z",
    "updated_at": "2026-05-22T15:20:00Z"
  },
  "order_number": "ORD-2026-00001",
  "customer_name": "John Doe",
  "shipping_address": "123 Main St, Springfield, IL 62701",
  "current_status": "in_transit",
  "estimated_delivery": "2026-05-25T10:00:00Z",
  "timeline": [
    {
      "id": 1,
      "status": "created",
      "location": null,
      "description": "Shipment created and ready for processing",
      "timestamp": "2026-05-18T14:30:00Z"
    },
    {
      "id": 2,
      "status": "packed",
      "location": "Warehouse A, Building 3",
      "description": "Order packed into box #12345",
      "timestamp": "2026-05-19T09:15:00Z"
    },
    {
      "id": 3,
      "status": "shipped",
      "location": "Chicago Distribution Hub",
      "description": "Package collected by courier, tracking with DHL",
      "timestamp": "2026-05-20T08:45:00Z"
    },
    {
      "id": 4,
      "status": "in_transit",
      "location": "Regional Hub - Indianapolis",
      "description": "Package in transit to destination city",
      "timestamp": "2026-05-22T15:20:00Z"
    }
  ]
}
```

---

### Public Tracking (No Login Required)

#### Track Order by ID
```bash
curl -X GET http://localhost:8000/shipments/track/1
```

**Response:**
```json
{
  "shipment": {...},
  "order_number": "ORD-2026-00001",
  "customer_name": "John Doe",
  "shipping_address": "123 Main St, Springfield, IL 62701",
  "current_status": "in_transit",
  "estimated_delivery": "2026-05-25T10:00:00Z",
  "timeline": [...]
}
```

---

## Python Client Example

```python
import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

# Login as admin
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "identifier": "admin@test.com",
        "password": "StrongAdminP@ss1"
    }
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create shipment
shipment_response = requests.post(
    f"{BASE_URL}/admin/shipments",
    headers=headers,
    json={
        "order_id": 1,
        "courier_name": "FedEx",
        "estimated_delivery_date": (
            datetime.utcnow() + timedelta(days=7)
        ).isoformat() + "Z"
    }
)

shipment = shipment_response.json()
shipment_id = shipment["id"]
print(f"Shipment created: {shipment['tracking_number']}")

# Update status
status_response = requests.put(
    f"{BASE_URL}/admin/shipments/{shipment_id}/status",
    headers=headers,
    json={
        "status": "packed",
        "location": "Warehouse A",
        "description": "Order packed"
    }
)

print(f"Status updated: {status_response.json()['status']}")

# Get tracking as user
user_token = "YOUR_USER_TOKEN"
user_headers = {"Authorization": f"Bearer {user_token}"}
tracking = requests.get(
    f"{BASE_URL}/orders/1/tracking",
    headers=user_headers
).json()

print(f"Current status: {tracking['current_status']}")
print(f"Timeline entries: {len(tracking['timeline'])}")
```

---

## Status Flow Example

Recommended status progression for standard delivery:

```
Order Confirmed
       ↓
   CREATED (auto-created shipment)
       ↓
   PACKED (manual update by warehouse)
       ↓
   SHIPPED (handed to courier)
       ↓
   IN_TRANSIT (in courier network)
       ↓
   OUT_FOR_DELIVERY (on delivery vehicle)
       ↓
   DELIVERED (successful delivery)
```

For failed deliveries:
```
IN_TRANSIT → FAILED → [retry or RETURNED]
```

---

## Testing Script

```python
#!/usr/bin/env python3
import requests
import time

BASE_URL = "http://localhost:8000"

def test_shipment_workflow():
    # Setup
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"identifier": "admin@test.com", "password": "StrongAdminP@ss1"}
    ).json()
    token = admin_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create shipment
    print("Creating shipment...")
    ship = requests.post(
        f"{BASE_URL}/admin/shipments",
        headers=headers,
        json={
            "order_id": 1,
            "courier_name": "Test Courier",
            "notes": "Test shipment"
        }
    ).json()
    sid = ship["id"]
    print(f"✓ Created: {ship['tracking_number']}")
    
    # Progress through statuses
    statuses = ["packed", "shipped", "in_transit", "out_for_delivery", "delivered"]
    locations = [
        "Warehouse A",
        "Distribution Hub",
        "Regional Center",
        "Local Delivery",
        "Customer Address"
    ]
    
    for status, location in zip(statuses, locations):
        requests.put(
            f"{BASE_URL}/admin/shipments/{sid}/status",
            headers=headers,
            json={
                "status": status,
                "location": location,
                "description": f"Update: {status}"
            }
        )
        print(f"✓ Updated to: {status}")
        time.sleep(0.5)
    
    # Get final timeline
    print("\nFinal timeline:")
    result = requests.get(f"{BASE_URL}/shipments/track/1").json()
    for entry in result["timeline"][-3:]:
        print(f"  {entry['status']:20} - {entry['description']}")

if __name__ == "__main__":
    test_shipment_workflow()
```

---

## Troubleshooting

### Issue: 401 Unauthorized on login
- Verify admin user exists: `python create_admin.py`
- Check password: `StrongAdminP@ss1`
- Check email: `admin@test.com`

### Issue: Order not found for shipment
- Ensure order exists in orders table
- Use `order_id` not `order_number`

### Issue: Shipment already exists
- Check if shipment already created for the order (unique constraint)
- Orders can only have one shipment

### Issue: CORS errors
- Ensure frontend is using correct API URL
- Check CORS settings in `app/core/config.py`