# Shipment & Tracking System Implementation

## Overview
A production-ready shipment management system integrated with the e-commerce order system. Automatically creates shipments when orders are confirmed and provides real-time tracking with timeline history.

## 1. Database Models

### Shipment Model
```python
# Location: app/models/shipment.py

class Shipment(Base):
    __tablename__ = 'shipments'
    
    id: Integer (Primary Key)
    order_id: Integer (Foreign Key to Order) - UNIQUE
    tracking_number: String(100) - Unique auto-generated
    courier_name: String(100) - e.g., "DHL", "FedEx"
    status: Enum (ShipmentStatus) - Current status
    estimated_delivery_date: DateTime - Expected delivery
    shipped_at: DateTime - When shipment was shipped
    delivered_at: DateTime - When order was delivered
    notes: Text - Additional notes
    created_at: DateTime - Record creation time
    updated_at: DateTime - Last update time
    
    Relationships:
    - order: One-to-One with Order
    - tracking_entries: One-to-Many with ShipmentTracking
```

### Shipment Status Enum
```python
class ShipmentStatus(PyEnum):
    CREATED = "created"           # Initial state
    PACKED = "packed"             # Order packaged
    SHIPPED = "shipped"           # Left warehouse
    IN_TRANSIT = "in_transit"     # On the way
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"       # Successfully delivered
    FAILED = "failed"             # Delivery failed
    RETURNED = "returned"         # Order returned
```

### ShipmentTracking Model
```python
class ShipmentTracking(Base):
    __tablename__ = 'shipment_tracking'
    
    id: Integer (Primary Key)
    shipment_id: Integer (Foreign Key)
    status: Enum (ShipmentStatus)
    location: String(200) - Current location/facility
    description: Text - Event description
    timestamp: DateTime - When event occurred
    
    Provides chronological history of all status changes
```

## 2. API Endpoints

### Admin Endpoints (Requires Admin Role)

#### POST /admin/shipments
Create a new shipment for an order.

**Request:**
```json
{
    "order_id": 1,
    "courier_name": "DHL Express",
    "estimated_delivery_date": "2026-05-20T10:00:00Z",
    "notes": "Fragile - Handle with care"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "order_id": 1,
    "tracking_number": "SHIP-A1B2C3D4E5F6",
    "courier_name": "DHL Express",
    "status": "created",
    "estimated_delivery_date": "2026-05-20T10:00:00Z",
    "shipped_at": null,
    "delivered_at": null,
    "notes": "Fragile - Handle with care",
    "created_at": "2026-05-15T14:30:00Z",
    "updated_at": "2026-05-15T14:30:00Z",
    "tracking_entries": [
        {
            "id": 1,
            "status": "created",
            "location": null,
            "description": "Shipment created and ready for processing",
            "timestamp": "2026-05-15T14:30:00Z"
        }
    ]
}
```

#### PUT /admin/shipments/{id}/status
Update shipment status.

**Request:**
```json
{
    "status": "shipped",
    "location": "Chicago Distribution Center",
    "description": "Handed over to courier for delivery"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "status": "shipped",
    "shipped_at": "2026-05-17T08:45:00Z",
    "tracking_entries": [
        {...},
        {
            "id": 3,
            "status": "shipped",
            "location": "Chicago Distribution Center",
            "description": "Handed over to courier for delivery",
            "timestamp": "2026-05-17T08:45:00Z"
        }
    ]
}
```

#### GET /admin/shipments
List all shipments with pagination.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100)

#### GET /admin/shipments/{id}
Get specific shipment details.

### User Endpoints

#### GET /orders/{id}/tracking
Get tracking information for user's order.

**Response (200 OK):**
```json
{
    "shipment": {
        "id": 1,
        "order_id": 1,
        "tracking_number": "SHIP-A1B2C3D4E5F6",
        "courier_name": "DHL Express",
        "status": "in_transit",
        "estimated_delivery_date": "2026-05-20T10:00:00Z",
        "shipped_at": "2026-05-17T08:45:00Z",
        "delivered_at": null,
        "created_at": "2026-05-15T14:30:00Z",
        "updated_at": "2026-05-18T15:20:00Z"
    },
    "order_number": "ORD-2026-001",
    "customer_name": "John Doe",
    "shipping_address": "123 Main St, City, 12345",
    "current_status": "in_transit",
    "estimated_delivery": "2026-05-20T10:00:00Z",
    "timeline": [
        {
            "id": 1,
            "status": "created",
            "location": null,
            "description": "Shipment created and ready for processing",
            "timestamp": "2026-05-15T14:30:00Z"
        },
        {
            "id": 2,
            "status": "packed",
            "location": "Warehouse A",
            "description": "Order packed and ready for shipping",
            "timestamp": "2026-05-16T10:15:00Z"
        },
        {
            "id": 3,
            "status": "shipped",
            "location": "Chicago Distribution Center",
            "description": "Handed over to courier",
            "timestamp": "2026-05-17T08:45:00Z"
        },
        {
            "id": 4,
            "status": "in_transit",
            "location": "Regional Hub - Indianapolis",
            "description": "Package in transit to destination",
            "timestamp": "2026-05-18T15:20:00Z"
        }
    ]
}
```

### Public Endpoint

#### GET /shipments/track/{order_id}
Public tracking endpoint (no authentication required).

Allows customers to track orders without login using order ID.

## 3. Key Features

### Automatic Shipment Creation
When an order is confirmed (status = 'confirmed'), a shipment is automatically created:

```python
# In order creation endpoint
if order.status == 'confirmed':
    auto_create_shipment_for_order(db, order)
```

- Default courier: "Standard Shipping"
- Default delivery: 5 days from now
- Automatic tracking number generation (SHIP-{UUID})

### Tracking Timeline
Each status update automatically creates a tracking entry with:
- Timestamp of the event
- Current status
- Location information
- Descriptive message

### Status Management
Predefined status flow recommendations:
```
CREATED → PACKED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                ↓
                           FAILED/RETURNED
```

## 4. Database Relationships

```
Order (1) ← → (1) Shipment
    ↓
  Many OrderItems

Shipment (1) ← → (Many) ShipmentTracking
    ↓
  Timeline history
```

## 5. Production Best Practices Implemented

✅ **Security:**
- Admin-only endpoints for shipment creation/modification
- User can only view their own order tracking
- Public tracking uses order ID (non-sensitive info)

✅ **Data Integrity:**
- Foreign key constraints
- Unique tracking number generation
- Cascade delete for cleanup

✅ **Performance:**
- Indexed foreign keys (order_id, shipment_id)
- Indexed tracking_number for quick lookups
- Efficient timeline queries

✅ **Scalability:**
- Enum-based status for consistency
- Pagination on list endpoints
- Async-ready FastAPI implementation

✅ **Error Handling:**
- Validation on delivery dates (must be future)
- Duplicate shipment prevention
- Clear error messages

✅ **Code Quality:**
- Separation of concerns (models, schemas, services, routers)
- Reusable service functions
- Type hints throughout
- Pydantic validation

## 6. Service Functions

### `create_shipment(db, shipment_data)`
Creates a new shipment and initial tracking entry.

### `update_shipment_status(db, shipment_id, status_update)`
Updates status and creates tracking entry. Automatically sets:
- `shipped_at` when status = SHIPPED
- `delivered_at` when status = DELIVERED

### `get_shipment_tracking(db, order_id)`
Retrieves complete tracking information including order and customer details.

### `auto_create_shipment_for_order(db, order)`
Automatically creates shipment for confirmed orders.

## 7. File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── shipment.py          (Shipment & ShipmentTracking models)
│   ├── schemas/
│   │   └── shipment.py          (Pydantic schemas)
│   ├── api/routers/
│   │   └── shipment.py          (API endpoints)
│   ├── services/
│   │   └── shipment_service.py  (Business logic)
│   └── models/
│       └── order.py             (Updated with shipment relationship)
```

## 8. Integration Points

### Order Creation
When order status becomes 'confirmed', shipment is auto-created.

### Frontend Integration
Frontend can call:
- `GET /orders/{id}/tracking` for authenticated users
- `GET /shipments/track/{order_id}` for public tracking

## 9. Future Enhancements

Potential additions:
- Webhook integration for courier updates
- SMS/Email notifications on status changes
- Return/RMA (Return Merchandise Authorization) management
- Multiple shipments per order (partial shipments)
- Custom carrier integrations (FedEx API, UPS API, etc.)
- Delivery proof (photos, signatures)
- Customer delivery preferences (hold for pickup, etc.)