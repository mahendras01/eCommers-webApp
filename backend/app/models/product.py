from datetime import datetime
from enum import Enum
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class ProductType(str, Enum):
    CLOTHING = 'CLOTHING'
    GROCERY = 'GROCERY'
    ELECTRONICS = 'ELECTRONICS'

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=120), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    subcategories = relationship('SubCategory', back_populates='category', cascade='all, delete-orphan')


class SubCategory(Base):
    __tablename__ = 'subcategories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=120), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    category = relationship('Category', back_populates='subcategories')
    products = relationship('Product', back_populates='subcategory', cascade='all, delete-orphan')


class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    image_url = Column(String(length=500), nullable=True)
    images = Column(Text, nullable=True)  # JSON array of image URLs
    color = Column(String(length=100), nullable=True)
    material = Column(String(length=255), nullable=True)
    features = Column(Text, nullable=True)  # Detailed features as JSON or comma-separated
    rating = Column(Float, nullable=False, default=0.0)
    review_count = Column(Integer, nullable=False, default=0)
    tax_percent = Column(Float, nullable=False, default=18.0)  # GST percentage (default 18% for India)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True, index=True)
    subcategory_id = Column(Integer, ForeignKey('subcategories.id'), nullable=True, index=True)
    product_type = Column(String(length=50), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    category = relationship('Category')
    subcategory = relationship('SubCategory', back_populates='products')
    variants = relationship('ProductVariant', back_populates='product', cascade='all, delete-orphan')


class ProductVariant(Base):
    __tablename__ = 'product_variants'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    sku = Column(String(length=100), nullable=False, index=True, unique=True)
    size = Column(String(length=50), nullable=True)  # e.g., S, M, L, XL or numeric
    weight = Column(Float, nullable=True)  # in kg
    volume = Column(Float, nullable=True)  # in liters
    price = Column(Float, nullable=False)  # variant-specific price
    stock = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship('Product', back_populates='variants')
