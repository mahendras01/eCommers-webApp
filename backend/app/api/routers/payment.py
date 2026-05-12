from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.schemas.payment import (
    RazorpayOrderCreate,
    RazorpayOrderResponse,
    PaymentVerificationRequest,
    PaymentVerificationResponse
)
from app.services.razorpay_service import get_razorpay_service

router = APIRouter(prefix="/payment", tags=["payment"])

logger = logging.getLogger(__name__)


@router.post("/create-order", response_model=RazorpayOrderResponse)
def create_payment_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Razorpay order for payment
    
    Flow:
    1. Get user's pending order (unpaid)
    2. Create Razorpay order with order amount
    3. Store order reference in database
    4. Return order details to frontend
    
    Security:
    - Only authenticated users can create orders
    - Amount is fetched from database (not from frontend)
    - Frontend cannot tamper with amount
    """
    try:
        # Get the most recent pending order for the user
        pending_order = db.query(Order).filter(
            Order.user_id == current_user.id,
            Order.status.in_(['pending', 'payment_pending', 'placed'])
        ).order_by(desc(Order.id)).first()
        
        if not pending_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending order found"
            )
        
        # Debug logging
        print(f"DEBUG: Found pending order ID {pending_order.id} with total_amount: {pending_order.total_amount}")
        
        # Convert amount to paise (Razorpay expects amount in paise)
        amount_in_paise = int(pending_order.total_amount * 100)
        
        # Debug logging
        print(f"DEBUG: Amount in paise: {amount_in_paise}")
        
        if amount_in_paise <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order amount: {pending_order.total_amount} (must be greater than 0)"
            )
        
        # Check if payment transaction already exists for this order
        existing_transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == pending_order.id
        ).first()
        
        razorpay_service = get_razorpay_service()
        
        # If transaction exists, reuse the Razorpay order ID
        if existing_transaction and existing_transaction.status == 'pending':
            return RazorpayOrderResponse(
                order_id=existing_transaction.razorpay_order_id,
                amount=existing_transaction.amount,
                currency=existing_transaction.currency,
                receipt=f"order_{pending_order.id}"
            )
        
        # Create new Razorpay order
        razorpay_order = razorpay_service.create_order(
            amount=amount_in_paise,
            currency='INR',
            receipt=f"order_{pending_order.id}",
            notes={
                'order_number': pending_order.order_number,  # User-friendly reference
                'order_id': pending_order.id,                # Internal ID
                'user_id': current_user.id,
                'customer_email': current_user.email,
                'country': 'IN',  # Specify India for test mode
                'market': 'india',
                'locale': 'en_IN',
                'payment_for': 'ecommerce_order'
            }
        )
        
        # Store payment transaction record
        payment_transaction = PaymentTransaction(
            order_id=pending_order.id,
            razorpay_order_id=razorpay_order['order_id'],
            amount=razorpay_order['amount'],
            currency=razorpay_order['currency'],
            status='pending'
        )
        db.add(payment_transaction)
        db.commit()
        db.refresh(payment_transaction)
        
        return RazorpayOrderResponse(
            order_id=razorpay_order['order_id'],
            amount=razorpay_order['amount'],
            currency=razorpay_order['currency'],
            receipt=razorpay_order['receipt']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment order creation failed for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"  # Generic message
        )


@router.post("/verify", response_model=PaymentVerificationResponse)
def verify_payment(
    verification_data: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify Razorpay payment signature
    
    Security Flow:
    1. Receive payment details from frontend
    2. Verify signature using secret key (backend only)
    3. Validate order amount
    4. Update order status to paid
    5. Store transaction details
    
    Why this is secure:
    - Secret key never exposed to frontend
    - Signature verification prevents payment tampering
    - Server confirms amount matches order
    - Prevents fake payment claims
    """
    try:
        razorpay_service = get_razorpay_service()
        
        # Step 1: Verify Razorpay signature
        is_valid, message = razorpay_service.verify_signature(
            order_id=verification_data.order_id,
            payment_id=verification_data.payment_id,
            signature=verification_data.signature
        )
        
        if not is_valid:
            # Log failed verification attempt
            return PaymentVerificationResponse(
                status='failure',
                message=message
            )
        
        # Step 2: Find payment transaction record
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_order_id == verification_data.order_id
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment transaction not found"
            )
        
        # Step 3: Verify order ownership
        order = db.query(Order).filter(
            Order.id == transaction.order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to this order"
            )
        
        # Step 4: Fetch payment details from Razorpay for verification
        payment_details = razorpay_service.fetch_payment_details(
            verification_data.payment_id
        )
        
        # Step 5: Verify amount matches (security check)
        if payment_details['amount'] != transaction.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount mismatch"
            )
        
        # Step 6: Update transaction status
        transaction.razorpay_payment_id = verification_data.payment_id
        transaction.razorpay_signature = verification_data.signature
        transaction.status = 'captured'
        transaction.payment_method = payment_details.get('method', 'unknown')
        
        # Step 7: Update order status to confirmed/paid
        from app.models.order import OrderStatus
        order.status = OrderStatus.CONFIRMED
        
        db.commit()
        
        return PaymentVerificationResponse(
            status='success',
            message='Payment verified successfully',
            transaction_id=str(transaction.id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Only update if order was found
        if 'order' in locals() and order:
            from app.models.order import OrderStatus
            order.status = OrderStatus.FAILED
            db.commit()
        # Log the error instead of exposing it
        logger.error(f"Payment verification error for user {current_user.id if 'current_user' in locals() else 'unknown'}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment verification failed"  # Generic message
        )


@router.get("/transaction/{order_id}")
def get_transaction_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get payment transaction details for an order
    
    Only the order owner can view transaction details
    """
    try:
        # Verify order ownership
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Get transaction details
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == order_id
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No payment transaction found"
            )
        
        return {
            'transaction_id': transaction.id,
            'razorpay_order_id': transaction.razorpay_order_id,
            'razorpay_payment_id': transaction.razorpay_payment_id,
            'amount': transaction.amount,
            'currency': transaction.currency,
            'status': transaction.status,
            'payment_method': transaction.payment_method,
            'created_at': transaction.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transaction details: {str(e)}"
        )
