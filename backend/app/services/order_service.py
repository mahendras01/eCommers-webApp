"""
Order Service - Utility functions for order management
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.order import Order, OrderStatus, OrderStatusHistory
from app.models.shipment import ShipmentStatus


def generate_order_number(db: Session) -> str:
    """
    Generate a unique user-friendly order number.
    
    Format: ORD-YYYY-XXXXXX
    - ORD: Static prefix
    - YYYY: Current year (e.g., 2026)
    - XXXXXX: Sequential number (zero-padded, 6 digits)
    
    Example: ORD-2026-000001, ORD-2026-000002, etc.
    
    Args:
        db: Database session
        
    Returns:
        str: Unique order number
    """
    current_year = datetime.utcnow().year
    
    # Find the maximum sequence number for current year
    last_order = db.query(Order).filter(
        Order.order_number.like(f'ORD-{current_year}-%')
    ).order_by(Order.id.desc()).first()
    
    if last_order:
        # Extract sequence number from last order
        # Format: ORD-2026-000013 -> 000013
        last_sequence = int(last_order.order_number.split('-')[-1])
        next_sequence = last_sequence + 1
    else:
        next_sequence = 1
    
    # Generate new order number with zero-padded sequence (6 digits)
    order_number = f'ORD-{current_year}-{next_sequence:06d}'
    
    return order_number


def is_order_cancellable(order: Order) -> bool:
    cancellable_statuses = {
        OrderStatus.PLACED,
        OrderStatus.CONFIRMED,
        OrderStatus.PAYMENT_PENDING,
    }
    if order.status not in cancellable_statuses:
        return False

    if order.shipment:
        blocked_shipment_statuses = {
            ShipmentStatus.PACKED,
            ShipmentStatus.SHIPPED,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.DELIVERED,
            ShipmentStatus.FAILED,
            ShipmentStatus.RETURNED,
        }
        if order.shipment.status in blocked_shipment_statuses:
            return False

    return True


def cancel_order(order: Order, reason: str | None = None) -> None:
    if order.status == OrderStatus.CANCELLED:
        raise ValueError('Order is already cancelled')

    if not is_order_cancellable(order):
        raise ValueError('Order cannot be cancelled at this stage')

    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    order.cancel_reason = reason

    if order.payment_transaction and order.payment_transaction.status == 'captured':
        order.refund_requested = True

    return None


def record_status_change(db: Session, order: Order, new_status: str, notes: str | None = None) -> OrderStatusHistory:
    """
    Record a status change in the order status history.
    
    Args:
        db: Database session
        order: Order object
        new_status: New status value
        notes: Optional notes about the status change
        
    Returns:
        OrderStatusHistory: The created history record
    """
    history_record = OrderStatusHistory(
        order_id=order.id,
        status=new_status,
        timestamp=datetime.utcnow(),
        notes=notes
    )
    db.add(history_record)
    return history_record


def update_order_status(db: Session, order: Order, new_status: str, notes: str | None = None) -> None:
    """
    Update order status and record it in history.
    
    Args:
        db: Database session
        order: Order object
        new_status: New status value
        notes: Optional notes about the status change
    """
    order.status = new_status
    order.updated_at = datetime.utcnow()
    record_status_change(db, order, new_status, notes)


def get_order_tracking(db: Session, order_id: int) -> dict | None:
    """
    Get complete order tracking information including status history.
    
    Args:
        db: Database session
        order_id: Order ID
        
    Returns:
        dict: Order tracking data with status history
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    
    # Get status history sorted by timestamp
    status_history = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id
    ).order_by(OrderStatusHistory.timestamp.asc()).all()
    
    return {
        'order_id': order.id,
        'order_number': order.order_number,
        'current_status': order.status,
        'status_history': status_history,
        'total_amount': order.total_amount,
        'shipping_address': order.shipping_address,
        'created_at': order.created_at,
    }
