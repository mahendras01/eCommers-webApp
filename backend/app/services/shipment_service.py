import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.shipment import Shipment, ShipmentTracking, ShipmentStatus
from app.models.order import Order
from app.schemas.shipment import ShipmentCreate, ShipmentStatusUpdate


def generate_tracking_number() -> str:
    """Generate a unique tracking number for shipments."""
    return f"SHIP-{uuid.uuid4().hex[:12].upper()}"


def create_shipment(db: Session, shipment_data: ShipmentCreate) -> Shipment:
    """Create a new shipment for an order."""
    # Check if order exists and doesn't already have a shipment
    order = db.query(Order).filter(Order.id == shipment_data.order_id).first()
    if not order:
        raise ValueError("Order not found")

    if order.shipment:
        raise ValueError("Order already has a shipment")

    # Generate tracking number
    tracking_number = generate_tracking_number()

    # Set default estimated delivery date if not provided (7 days from now)
    estimated_delivery = shipment_data.estimated_delivery_date
    if not estimated_delivery:
        estimated_delivery = datetime.utcnow() + timedelta(days=7)

    shipment = Shipment(
        order_id=shipment_data.order_id,
        tracking_number=tracking_number,
        courier_name=shipment_data.courier_name,
        status=ShipmentStatus.CREATED,
        estimated_delivery_date=estimated_delivery,
        notes=shipment_data.notes
    )

    db.add(shipment)
    db.flush()  # Get the ID

    # Create initial tracking entry
    tracking_entry = ShipmentTracking(
        shipment_id=shipment.id,
        status=ShipmentStatus.CREATED,
        description="Shipment created and ready for processing"
    )
    db.add(tracking_entry)

    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment_status(
    db: Session,
    shipment_id: int,
    status_update: ShipmentStatusUpdate
) -> Shipment:
    """Update shipment status and create tracking entry."""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise ValueError("Shipment not found")

    old_status = shipment.status
    new_status = status_update.status

    # Update shipment fields based on status
    if new_status == ShipmentStatus.SHIPPED and not shipment.shipped_at:
        shipment.shipped_at = datetime.utcnow()
    elif new_status == ShipmentStatus.DELIVERED and not shipment.delivered_at:
        shipment.delivered_at = datetime.utcnow()

    shipment.status = new_status
    shipment.updated_at = datetime.utcnow()

    # Create tracking entry
    tracking_entry = ShipmentTracking(
        shipment_id=shipment.id,
        status=new_status,
        location=status_update.location,
        description=status_update.description or f"Status changed from {old_status.value} to {new_status.value}"
    )
    db.add(tracking_entry)

    db.commit()
    db.refresh(shipment)
    return shipment


def get_shipment_tracking(db: Session, order_id: int) -> Optional[dict]:
    """Get tracking information for an order."""
    from app.models.user import User

    shipment = db.query(Shipment).filter(Shipment.order_id == order_id).first()
    if not shipment:
        return None

    order = db.query(Order).filter(Order.id == order_id).first()
    user = db.query(User).filter(User.id == order.user_id).first()

    tracking_entries = db.query(ShipmentTracking).filter(
        ShipmentTracking.shipment_id == shipment.id
    ).order_by(ShipmentTracking.timestamp.desc()).all()

    return {
        "shipment": shipment,
        "order_number": order.order_number,
        "customer_name": user.name,
        "shipping_address": order.shipping_address,
        "current_status": shipment.status,
        "estimated_delivery": shipment.estimated_delivery_date,
        "timeline": tracking_entries
    }


def auto_create_shipment_for_order(db: Session, order: Order) -> Optional[Shipment]:
    """Automatically create shipment when order is confirmed."""
    # Only create shipment for confirmed orders that don't have one
    from app.models.order import OrderStatus
    if order.status != OrderStatus.CONFIRMED or order.shipment:
        return None

    # Default courier and settings
    shipment_data = ShipmentCreate(
        order_id=order.id,
        courier_name="Standard Shipping",
        estimated_delivery_date=datetime.utcnow() + timedelta(days=5)  # 5 days delivery
    )

    try:
        return create_shipment(db, shipment_data)
    except Exception:
        # Log error but don't fail order creation
        return None