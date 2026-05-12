from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_admin_user
from app.models.shipment import Shipment
from app.models.order import Order
from app.models.user import User
from app.schemas.shipment import (
    ShipmentCreate, ShipmentRead, ShipmentUpdate,
    ShipmentStatusUpdate, TrackingTimeline
)
from app.services.shipment_service import (
    create_shipment, update_shipment_status, get_shipment_tracking
)

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.post("/", response_model=ShipmentRead, status_code=status.HTTP_201_CREATED)
def create_admin_shipment(
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """Create a new shipment for an order (Admin only)."""
    try:
        shipment = create_shipment(db, shipment_data)
        return shipment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{shipment_id}/status", response_model=ShipmentRead)
def update_shipment_status_admin(
    shipment_id: int,
    status_update: ShipmentStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """Update shipment status (Admin only)."""
    try:
        shipment = update_shipment_status(db, shipment_id, status_update)
        return shipment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/", response_model=List[ShipmentRead])
def list_admin_shipments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """List all shipments (Admin only)."""
    shipments = db.query(Shipment).offset(skip).limit(limit).all()
    return shipments


@router.get("/{shipment_id}", response_model=ShipmentRead)
def get_admin_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """Get shipment details (Admin only)."""
    shipment = db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return shipment


# Public tracking endpoint (no auth required for tracking)
@router.get("/track/{order_id}", response_model=TrackingTimeline)
def get_order_tracking(order_id: int, db: Session = Depends(get_db)):
    """Get tracking information for an order (Public endpoint)."""
    tracking_data = get_shipment_tracking(db, order_id)
    if not tracking_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No shipment found for this order"
        )

    return TrackingTimeline(
        shipment=tracking_data["shipment"],
        order_number=tracking_data["order_number"],
        customer_name=tracking_data["customer_name"],
        shipping_address=tracking_data["shipping_address"],
        current_status=tracking_data["current_status"],
        estimated_delivery=tracking_data["estimated_delivery"],
        timeline=tracking_data["timeline"]
    )