from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemRead, CartRead, CartCalculationResponse, CartCalculationRequest
from app.services.cart_service import calculate_cart_pricing, calculate_pricing_for_items

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("/", response_model=CartRead)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's cart with all items and total price."""
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    total_items = sum(item.quantity for item in cart_items)
    total_price = sum(item.product.price * item.quantity for item in cart_items)
    
    return CartRead(
        items=cart_items,
        total_items=total_items,
        total_price=total_price
    )


@router.post("/", response_model=CartItemRead, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a product to cart or increase quantity if already exists."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if item already in cart
    cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item.product_id
    ).first()
    
    if cart_item:
        # Increase quantity
        cart_item.quantity += item.quantity
        db.commit()
        db.refresh(cart_item)
        return cart_item
    
    # Create new cart item
    new_cart_item = CartItem(
        user_id=current_user.id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(new_cart_item)
    db.commit()
    db.refresh(new_cart_item)
    
    return new_cart_item


@router.put("/{item_id}", response_model=CartItemRead)
def update_cart_item(
    item_id: int,
    update_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update quantity of an item in cart."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    cart_item.quantity = update_data.quantity
    db.commit()
    db.refresh(cart_item)
    
    return cart_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an item from cart."""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    db.delete(cart_item)
    db.commit()


@router.post("/calculate/pricing", response_model=CartCalculationResponse)
def calculate_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate complete pricing for current user's cart.
    
    Returns:
    - subtotal: Sum of all product prices × quantities
    - tax: Total tax amount based on product tax rates
    - tax_breakdown: Breakdown of tax by tax rate
    - shipping: Shipping cost (flat rate)
    - total: subtotal + tax + shipping
    - items_count: Total number of items
    """
    pricing = calculate_cart_pricing(db, current_user)
    return CartCalculationResponse(**pricing)

