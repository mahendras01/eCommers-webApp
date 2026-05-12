"""
Script to create admin user
Run: python create_admin.py

This script is idempotent and safe to run multiple times.
It checks if the admin user exists before creating.
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.product import Product, Category, SubCategory
from app.models.cart import CartItem
from app.models.order import Order
from app.models.address import Address
from app.models.payment import PaymentTransaction
from app.services.auth import hash_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if admin user already exists
    existing_admin = db.query(User).filter(User.email == "admin@test.com").first()
    if existing_admin:
        print("Admin user already exists!")
        print(f"Email: {existing_admin.email}")
        print(f"Current Role: {existing_admin.role}")
        
        if existing_admin.role != "admin":
            existing_admin.role = "admin"
            existing_admin.hashed_password = hash_password("StrongAdminP@ss1")
            db.commit()
            print("✅ Updated user role to admin and reset password!")
        else:
            print("User already has admin role.")
    else:
        # Create admin user
        admin = User(
            name="Admin User",
            email="admin@test.com",
            hashed_password=hash_password("StrongAdminP@ss1"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("✅ Admin user created successfully!")
        print(f"Email: {admin.email}")
        print(f"Password: StrongAdminP@ss1")
        print(f"Role: {admin.role}")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()