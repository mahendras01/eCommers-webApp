# -*- coding: utf-8 -*-
"""
Database Migration Script - Add order_number column to existing orders table
"""

import sys
from pathlib import Path
import sqlite3
from datetime import datetime


def column_exists(conn, table_name, column_name):
    """Check if column exists in SQLite table"""
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info({})".format(table_name))
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns


def add_order_number_column():
    """Add order_number column to orders table if it doesn't exist"""
    
    # SQLite connection for schema operations
    import os
    db_path = os.path.join(Path(__file__).parent.parent, 'ecommerce.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("=" * 70)
        print("DATABASE MIGRATION: Adding order_number column")
        print("=" * 70)
        print()
        
        # Step 1: Check if column exists
        if column_exists(conn, 'orders', 'order_number'):
            print("OK Column 'order_number' already exists in 'orders' table")
            print("   No migration needed.")
            conn.close()
            return
        
        print("WAIT Adding 'order_number' column to 'orders' table...")
        
        # Step 2: Add column
        cursor.execute("""
            ALTER TABLE orders 
            ADD COLUMN order_number VARCHAR(50)
        """)
        conn.commit()
        print("OK Column added successfully")
        print()
        
        # Step 3: Backfill order_number for existing orders
        print("WAIT Backfilling order_number for existing orders...")
        cursor.execute("""
            SELECT id, created_at FROM orders 
            ORDER BY created_at ASC
        """)
        orders = cursor.fetchall()
        
        if not orders:
            print("   No orders to backfill")
            conn.close()
            return
        
        # Group by year
        orders_by_year = {}
        for order_id, created_at_str in orders:
            # Parse created_at (format: 2026-05-10 10:30:00)
            try:
                created_at = datetime.strptime(created_at_str, '%Y-%m-%d %H:%M:%S')
            except Exception:
                created_at = datetime.now()
            
            year = created_at.year
            orders_by_year.setdefault(year, []).append(order_id)
        
        # Generate and insert order_number for each order
        total_updated = 0
        for year in sorted(orders_by_year.keys()):
            year_orders = orders_by_year[year]
            print("  Processing {} orders from {}:".format(len(year_orders), year))
            
            for sequence, order_id in enumerate(year_orders, 1):
                order_number = 'ORD-{}-{:06d}'.format(year, sequence)
                cursor.execute("""
                    UPDATE orders 
                    SET order_number = ? 
                    WHERE id = ?
                """, (order_number, order_id))
                print("    OK Order ID {} -> {}".format(order_id, order_number))
                total_updated += 1
        
        conn.commit()
        print()
        print("OK Updated {} orders with order_number".format(total_updated))
        print()

        # Step 4: Create unique index for order_number
        print("WAIT Creating unique index on order_number...")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_orders_order_number ON orders(order_number)")
        conn.commit()
        print("OK Unique index created")
        print()

        # Step 5: Verify migration
        print("WAIT Verifying migration...")
        cursor.execute("SELECT COUNT(*) FROM orders WHERE order_number IS NOT NULL")
        count_with_number = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_count = cursor.fetchone()[0]
        
        if count_with_number == total_count:
            print("OK Verification successful: All {} orders have order_number".format(total_count))
        else:
            print("WARN Warning: {} orders missing order_number".format(total_count - count_with_number))
        
        print()
        print("=" * 70)
        print("OK MIGRATION COMPLETE")
        print("=" * 70)
        print()
        print("Summary:")
        print("  - Column added: order_number (VARCHAR(50), UNIQUE)")
        print("  - Orders updated: {}".format(count_with_number))
        print("  - Format: ORD-YYYY-XXXXXX (e.g., ORD-2026-000001)")
        print()
        
    except Exception as e:
        conn.rollback()
        print("\nERROR Migration failed: {}".format(str(e)))
        print("   Error details: {}".format(repr(e)))
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print()
    try:
        add_order_number_column()
    except Exception as e:
        print("\nERROR MIGRATION FAILED")
        sys.exit(1)
