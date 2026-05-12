"""
Test admin login
Run: python test_admin_login.py
"""
import requests
from app.services.auth import verify_password
from app.models.user import User
from app.models.product import Product, Category, SubCategory
from app.models.cart import CartItem
from app.models.order import Order
from app.models.address import Address
from app.models.payment import PaymentTransaction
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

# Test the login endpoint
def test_admin_login():
    url = "http://localhost:8000/auth/login"
    data = {
        "identifier": "admin@test.com",
        "password": "StrongAdminP@ss1"
    }

    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"Access token: {result['access_token'][:50]}...")
            print(f"Token type: {result['token_type']}")
            return True
        else:
            print(f"❌ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the server is running on port 8000")
        return False

# Test password verification directly
def test_password_directly():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@test.com").first()
        if user:
            is_valid = verify_password("StrongAdminP@ss1", user.hashed_password)
            print(f"Direct password verification: {'✅ Valid' if is_valid else '❌ Invalid'}")
            print(f"User role: {user.role}")
            return is_valid
        else:
            print("❌ Admin user not found in database")
            return False
    finally:
        db.close()

if __name__ == "__main__":
    print("Testing admin login...")
    print("\n1. Testing direct password verification:")
    test_password_directly()

    print("\n2. Testing login endpoint:")
    test_admin_login()