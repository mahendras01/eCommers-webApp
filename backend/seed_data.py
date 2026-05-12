"""
Seed script to populate initial categories and subcategories.
Run: python seed_data.py

This script is idempotent and safe to run multiple times.
It checks if categories/subcategories exist before inserting.
"""
import sys
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.product import Category, SubCategory

CATEGORY_DATA = {
    "Electronics": [
        "Mobile Phones",
        "Laptops",
        "Tablets",
        "Smart Watches",
        "Headphones & Earbuds",
        "Speakers",
        "Power Banks",
        "Cameras",
    ],
    "Fashion": [
        "Men T-Shirts",
        "Men Shirts",
        "Men Jeans",
        "Women Dresses",
        "Women Tops",
        "Women Kurtis",
        "Footwear",
    ],
    "Home & Kitchen": [
        "Kitchen Appliances",
        "Cookware",
        "Home Decor",
        "Furniture",
        "Storage & Organization",
        "Bedding",
    ],
    "Beauty & Personal Care": [
        "Skincare",
        "Haircare",
        "Makeup",
        "Fragrances",
        "Grooming",
    ],
    "Grocery": [
        "Staples",
        "Snacks",
        "Beverages",
        "Dairy Products",
        "Packaged Food",
    ],
    "Baby & Kids": [
        "Baby Clothing",
        "Toys",
        "School Supplies",
        "Baby Care",
    ],
    "Sports & Fitness": [
        "Gym Equipment",
        "Sports Gear",
        "Yoga Accessories",
        "Outdoor Equipment",
    ],
    "Books & Stationery": [
        "Educational Books",
        "Novels",
        "Office Supplies",
        "School Supplies",
    ],
}


def get_or_create_category(db, name: str) -> tuple[Category, bool]:
    category = db.query(Category).filter(Category.name == name).first()
    if category:
        return category, False

    category = Category(name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category, True


def get_or_create_subcategory(db, name: str, category_id: int) -> tuple[SubCategory, bool]:
    subcategory = (
        db.query(SubCategory)
        .filter(SubCategory.name == name, SubCategory.category_id == category_id)
        .first()
    )
    if subcategory:
        return subcategory, False

    subcategory = SubCategory(name=name, category_id=category_id)
    db.add(subcategory)
    db.commit()
    db.refresh(subcategory)
    return subcategory, True


def seed_categories_and_subcategories() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        created_categories = 0
        created_subcategories = 0

        for category_name, subcategory_list in CATEGORY_DATA.items():
            category, category_created = get_or_create_category(db, category_name)
            if category_created:
                created_categories += 1

            for subcategory_name in subcategory_list:
                _, subcategory_created = get_or_create_subcategory(db, subcategory_name, category.id)
                if subcategory_created:
                    created_subcategories += 1

        print("✅ Category and subcategory seeding complete.")
        print(f"  Categories inserted: {created_categories}")
        print(f"  SubCategories inserted: {created_subcategories}")
        print(f"  Total categories available: {len(CATEGORY_DATA)}")
        print(f"  Total subcategories expected: {sum(len(v) for v in CATEGORY_DATA.values())}")
    except Exception as exc:
        db.rollback()
        print(f"❌ Error seeding categories/subcategories: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == '__main__':
    seed_categories_and_subcategories()
