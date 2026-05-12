"""
Cart calculation service for pricing operations.
Implements consistent pricing logic used across checkout, cart, and order creation.
"""
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.cart import CartItem
from app.models.user import User


# Shipping configuration
FLAT_SHIPPING_COST = 100.0  # ₹100 flat shipping


def calculate_cart_pricing(db: Session, user: User) -> dict:
    """
    Calculate complete pricing for a user's cart.
    
    Args:
        db: Database session
        user: Current user
        
    Returns:
        Dictionary with subtotal, tax, shipping, and total
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    
    if not cart_items:
        return {
            'subtotal': 0.0,
            'tax': 0.0,
            'tax_breakdown': {},
            'shipping': FLAT_SHIPPING_COST,
            'total': FLAT_SHIPPING_COST,
            'items_count': 0
        }
    
    subtotal = 0.0
    total_tax = 0.0
    tax_breakdown = {}
    items_count = 0
    
    for cart_item in cart_items:
        product = cart_item.product
        if not product:
            continue
            
        # Calculate line subtotal
        line_subtotal = product.price * cart_item.quantity
        subtotal += line_subtotal
        items_count += cart_item.quantity
        
        # Calculate tax for this item
        tax_rate = product.tax_percent
        line_tax = line_subtotal * (tax_rate / 100.0)
        total_tax += line_tax
        
        # Track tax breakdown by rate
        if tax_rate not in tax_breakdown:
            tax_breakdown[tax_rate] = 0.0
        tax_breakdown[tax_rate] += line_tax
    
    # Calculate shipping
    shipping = FLAT_SHIPPING_COST
    
    # Calculate total
    total = subtotal + total_tax + shipping
    
    return {
        'subtotal': round(subtotal, 2),
        'tax': round(total_tax, 2),
        'tax_breakdown': {str(rate): round(amount, 2) for rate, amount in tax_breakdown.items()},
        'shipping': shipping,
        'total': round(total, 2),
        'items_count': items_count
    }


def calculate_pricing_for_items(db: Session, items: list[dict]) -> dict:
    """
    Calculate pricing for a list of items (product_id, quantity).
    Used for guest carts and pricing previews.
    
    Args:
        db: Database session
        items: List of dicts with 'product_id' and 'quantity'
        
    Returns:
        Dictionary with subtotal, tax, shipping, and total
    """
    subtotal = 0.0
    total_tax = 0.0
    tax_breakdown = {}
    items_count = 0
    
    for item in items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        
        if not product_id or quantity < 1:
            continue
        
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            continue
        
        # Calculate line subtotal
        line_subtotal = product.price * quantity
        subtotal += line_subtotal
        items_count += quantity
        
        # Calculate tax for this item
        tax_rate = product.tax_percent
        line_tax = line_subtotal * (tax_rate / 100.0)
        total_tax += line_tax
        
        # Track tax breakdown by rate
        if tax_rate not in tax_breakdown:
            tax_breakdown[tax_rate] = 0.0
        tax_breakdown[tax_rate] += line_tax
    
    # Calculate shipping
    shipping = FLAT_SHIPPING_COST
    
    # Calculate total
    total = subtotal + total_tax + shipping
    
    return {
        'subtotal': round(subtotal, 2),
        'tax': round(total_tax, 2),
        'tax_breakdown': {str(rate): round(amount, 2) for rate, amount in tax_breakdown.items()},
        'shipping': shipping,
        'total': round(total, 2),
        'items_count': items_count
    }
