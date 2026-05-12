"""
Migration script to generate order_number for existing orders in database.

Usage:
    python scripts/migrate_order_numbers.py

This script:
1. Queries all orders without an order_number
2. Generates unique order_number for each based on creation year and sequence
3. Updates the database with the new order_number values
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.order import Order
from app.core.config import settings
from app.services.order_service import generate_order_number


def migrate_existing_orders():
    """Generate and update order_number for all existing orders."""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find all orders without order_number
        orders_without_number = db.query(Order).filter(
            Order.order_number == None
        ).order_by(Order.created_at.asc()).all()
        
        if not orders_without_number:
            print("✅ All orders already have order_number. No migration needed.")
            return
        
        print(f"📦 Found {len(orders_without_number)} orders without order_number")
        print("🔄 Starting migration...\n")
        
        # Group orders by year for better tracking
        orders_by_year = {}
        for order in orders_without_number:
            year = order.created_at.year
            if year not in orders_by_year:
                orders_by_year[year] = []
            orders_by_year[year].append(order)
        
        total_updated = 0
        
        # Process each year
        for year in sorted(orders_by_year.keys()):
            year_orders = orders_by_year[year]
            print(f"Processing {len(year_orders)} orders from {year}...")
            
            for sequence, order in enumerate(year_orders, 1):
                order_number = f'ORD-{year}-{sequence:06d}'
                order.order_number = order_number
                total_updated += 1
                print(f"  ✓ Order ID {order.id} → {order_number}")
        
        # Commit all changes
        db.commit()
        print(f"\n✅ Migration complete! Updated {total_updated} orders.")
        print("\nSummary by year:")
        for year in sorted(orders_by_year.keys()):
            print(f"  {year}: {len(orders_by_year[year])} orders")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Order Number Migration Script")
    print("=" * 60 + "\n")
    
    migrate_existing_orders()
