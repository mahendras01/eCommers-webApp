"""
Seed script to populate database with sample products including images, highlights, and features.
Run: python seed_products.py
"""
import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.product import Product, Category, SubCategory

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Clear existing data
    db.query(Product).delete()
    db.query(SubCategory).delete()
    db.query(Category).delete()

    # Create categories
    electronics = Category(name="Electronics")
    clothing = Category(name="Clothing")
    accessories = Category(name="Accessories")
    
    db.add_all([electronics, clothing, accessories])
    db.commit()

    # Create subcategories
    smartphones = SubCategory(name="Smartphones", category_id=electronics.id)
    laptops = SubCategory(name="Laptops", category_id=electronics.id)
    headphones = SubCategory(name="Headphones", category_id=electronics.id)
    
    tshirts = SubCategory(name="T-Shirts", category_id=clothing.id)
    shoes = SubCategory(name="Shoes", category_id=clothing.id)
    
    bottles = SubCategory(name="Water Bottles", category_id=accessories.id)
    cables = SubCategory(name="Cables", category_id=accessories.id)
    
    db.add_all([smartphones, laptops, headphones, tshirts, shoes, bottles, cables])
    db.commit()

    # Sample products with all details
    products = [
        Product(
            name="Premium Wireless Headphones",
            description="High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.",
            price=4999.00,
            stock=15,
            image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
            images=json.dumps([
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop",
            ]),
            color="Matte Black",
            material="Premium Aluminum & Soft-Touch Plastic",
            features=json.dumps([
                "Active Noise Cancellation (ANC)",
                "30-hour battery life",
                "Bluetooth 5.0 connectivity",
                "Built-in microphone for calls",
                "Comfortable over-ear design",
                "Lightweight at 250g",
                "3.5mm aux cable included"
            ]),
            rating=4.8,
            review_count=342,
            category_id=electronics.id,
            subcategory_id=headphones.id
        ),
        Product(
            name="Classic Cotton T-Shirt",
            description="Comfortable, soft cotton t-shirt perfect for everyday wear. Available in multiple colors with a modern fit that works with any outfit.",
            price=599.00,
            stock=50,
            image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
            images=json.dumps([
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1529720190099-de6af83e7e1c?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1556821552-5ff41cf4a9d9?w=400&h=400&fit=crop",
            ]),
            color="Crisp White",
            material="100% Pure Cotton",
            features=json.dumps([
                "100% organic cotton",
                "Breathable and comfortable",
                "Machine washable",
                "Available in S, M, L, XL, XXL",
                "Eco-friendly production",
                "Preshrunk for durability",
                "Perfect for casual wear"
            ]),
            rating=4.5,
            review_count=128,
            category_id=clothing.id,
            subcategory_id=tshirts.id
        ),
        Product(
            name="Stainless Steel Water Bottle",
            description="Keep your drinks hot or cold for hours with this double-walled insulated water bottle. Perfect for gym, office, or outdoor activities.",
            price=899.00,
            stock=30,
            image_url="https://images.unsplash.com/photo-1602143407151-7e406dc6ff47?w=400&h=400&fit=crop",
            images=json.dumps([
                "https://images.unsplash.com/photo-1602143407151-7e406dc6ff47?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1527280941076-2e216674a139?w=400&h=400&fit=crop",
            ]),
            color="Midnight Blue",
            material="Food-Grade Stainless Steel 18/8",
            features=json.dumps([
                "Double-walled insulation",
                "Keeps drinks cold for 24 hours",
                "Keeps drinks hot for 12 hours",
                "Leak-proof design",
                "BPA-free and eco-friendly",
                "Capacity: 750ml",
                "Easy to carry with handle"
            ]),
            rating=4.7,
            review_count=256,
            category_id=accessories.id,
            subcategory_id=bottles.id
        ),
        Product(
            name="USB-C Fast Charging Cable",
            description="High-quality USB-C cable with fast charging capability. Compatible with all modern smartphones, tablets, and laptops.",
            price=299.00,
            stock=100,
            image_url="https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
            images=json.dumps([
                "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
            ]),
            color="Silver",
            material="Nylon Braided Copper Core",
            features=json.dumps([
                "Supports 60W fast charging",
                "2-meter length",
                "Durable nylon braided exterior",
                "Gold-plated connectors",
                "Works with all USB-C devices",
                "5-year warranty",
                "Tested for safety and durability"
            ]),
            rating=4.6,
            review_count=189,
            category_id=electronics.id,
            subcategory_id=cables.id
        ),
        Product(
            name="Comfortable Running Shoes",
            description="Engineered for comfort and performance, these running shoes provide excellent support for long-distance running and everyday activity.",
            price=3499.00,
            stock=20,
            image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
            images=json.dumps([
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
            ]),
            color="Royal Blue",
            material="Mesh & Synthetic Upper with Rubber Sole",
            features=json.dumps([
                "Advanced cushioning technology",
                "Breathable mesh upper",
                "Lightweight design",
                "Suitable for marathon running",
                "Available in sizes 5-13",
                "Water-resistant coating",
                "Non-slip rubber sole for grip"
            ]),
            rating=4.9,
            review_count=567,
            category_id=clothing.id,
            subcategory_id=shoes.id
        ),
    ]

    db.add_all(products)
    db.commit()

    print("✅ Database seeded successfully!")
    print(f"Created {len(products)} products with detailed information")
    
except Exception as e:
    db.rollback()
    print(f"❌ Error seeding database: {e}")
finally:
    db.close()
