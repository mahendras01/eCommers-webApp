from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.cart import CartItem
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCancelRequest, OrderCreate, OrderRead, OrderListRead, OrderTrackingResponse
from app.schemas.shipment import TrackingTimeline
from app.services.order_service import cancel_order, generate_order_number, is_order_cancellable, record_status_change, get_order_tracking
from app.services.shipment_service import auto_create_shipment_for_order, get_shipment_tracking

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an order from the current user's cart."""
    print(f"DEBUG: Creating order for user {current_user.id}")
    print(f"DEBUG: Order data: payment_method={order_data.payment_method}, shipping_address length={len(order_data.shipping_address or '')}")
    print(f"DEBUG: Full shipping_address: '{order_data.shipping_address}'")
    
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    total_amount = 0.0
    order_items = []
    invalid_items = []
    for cart_item in cart_items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if not product:
            invalid_items.append(cart_item)
            continue
        if cart_item.quantity > product.stock:
            invalid_items.append(cart_item)
            continue
        order_items.append((product, cart_item.quantity))
        total_amount += product.price * cart_item.quantity

    # Remove invalid cart items
    for invalid_item in invalid_items:
        db.delete(invalid_item)

    db.commit()  # Commit the deletions

    if not order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid items in cart. Items may be out of stock or no longer available."
        )

    print(f"DEBUG: Calculated total_amount: {total_amount}")
    
    initial_status = OrderStatus.CONFIRMED if order_data.payment_method == 'cash_on_delivery' else OrderStatus.PLACED

    # Generate unique order number
    order_number = generate_order_number(db)
    print(f"DEBUG: Generated order_number: {order_number}")
    
    order = Order(
        order_number=order_number,
        user_id=current_user.id,
        status=initial_status,
        total_amount=total_amount,  # Set the calculated total amount
        shipping_address=order_data.shipping_address,
        payment_method=order_data.payment_method,
    )
    db.add(order)
    db.flush()

    for product, quantity in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.add(order_item)
        product.stock -= quantity

    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    db.refresh(order)

    # Record initial status in history
    record_status_change(db, order, initial_status.value, "Order created")
    db.commit()

    # Auto-create shipment for confirmed orders
    if order.status == OrderStatus.CONFIRMED:
        auto_create_shipment_for_order(db, order)

    user_order_index = db.query(func.count(Order.id)).filter(
        Order.user_id == current_user.id,
        Order.id <= order.id
    ).scalar()

    return OrderRead.model_validate(order).copy(update={
        'user_order_index': int(user_order_index)
    })


@router.put("/{order_id}/cancel", response_model=OrderRead)
def cancel_order_for_user(
    order_id: int,
    cancel_request: OrderCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order if the user owns it and it is cancellable."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Order not found')

    try:
        cancel_order(order, cancel_request.reason)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    db.add(order)
    db.commit()
    db.refresh(order)

    return OrderRead.model_validate(order).copy(update={
        'user_order_index': db.query(func.count(Order.id)).filter(
            Order.user_id == current_user.id,
            Order.id <= order.id
        ).scalar()
    })


@router.get("/", response_model=OrderListRead)
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders for the current user."""
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.asc()).all()

    print(f"DEBUG: GET /orders for user {current_user.id} returned {[order.status for order in orders]}")
    order_responses = []
    for index, order in enumerate(orders, start=1):
        order_responses.append(
            OrderRead.model_validate(order).copy(update={
                'user_order_index': index
            })
        )
    return OrderListRead(orders=order_responses)


@router.get("/{order_id}/tracking", response_model=TrackingTimeline)
def get_order_shipment_tracking(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tracking information for a specific order."""
    # Verify the order belongs to the current user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

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


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single order for the current user."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    user_order_index = db.query(func.count(Order.id)).filter(
        Order.user_id == current_user.id,
        Order.id <= order.id
    ).scalar()

    print(f"DEBUG: GET /orders/{order_id} for user {current_user.id} returned status {order.status}")
    return OrderRead.model_validate(order).copy(update={
        'user_order_index': int(user_order_index)
    })


@router.get("/{order_id}/status-history", response_model=OrderTrackingResponse)
def get_order_status_history(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete order tracking information with full status history."""
    # Verify the order belongs to the current user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    tracking_data = get_order_tracking(db, order_id)
    if not tracking_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve tracking information"
        )

    return OrderTrackingResponse.model_validate(tracking_data)
