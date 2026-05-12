from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List


class ProductType(str, Enum):
    CLOTHING = 'CLOTHING'
    GROCERY = 'GROCERY'
    ELECTRONICS = 'ELECTRONICS'


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class CategoryRead(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SubCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    category_id: int = Field(..., gt=0)


class SubCategoryRead(BaseModel):
    id: int
    name: str
    category_id: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = Field(default=None)
    images: Optional[str] = Field(default=None)
    color: Optional[str] = Field(default=None, max_length=100)
    material: Optional[str] = Field(default=None, max_length=255)
    features: Optional[str] = Field(default=None)
    rating: float = Field(default=0.0, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)
    tax_percent: float = Field(default=18.0, ge=0, le=100)
    category_id: Optional[int] = Field(default=None)
    subcategory_id: Optional[int] = Field(default=None)
    product_type: Optional[ProductType] = Field(default=None)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, min_length=10)
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None)
    images: Optional[str] = Field(default=None)
    color: Optional[str] = Field(default=None, max_length=100)
    material: Optional[str] = Field(default=None, max_length=255)
    features: Optional[str] = Field(default=None)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    review_count: Optional[int] = Field(default=None, ge=0)
    tax_percent: Optional[float] = Field(default=None, ge=0, le=100)
    category_id: Optional[int] = Field(default=None)
    subcategory_id: Optional[int] = Field(default=None)
    product_type: Optional[ProductType] = Field(default=None)


class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str]
    images: Optional[str]
    color: Optional[str]
    material: Optional[str]
    features: Optional[str]
    rating: float
    review_count: int
    tax_percent: float
    category_id: Optional[int]
    subcategory_id: Optional[int]
    product_type: Optional[ProductType]

    class Config:
        from_attributes = True


class ProductVariantCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    size: Optional[str] = Field(default=None, max_length=50)
    weight: Optional[float] = Field(default=None, ge=0)
    volume: Optional[float] = Field(default=None, ge=0)
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)


class ProductVariantUpdate(BaseModel):
    size: Optional[str] = Field(default=None, max_length=50)
    weight: Optional[float] = Field(default=None, ge=0)
    volume: Optional[float] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)


class ProductVariantRead(BaseModel):
    id: int
    product_id: int
    sku: str
    size: Optional[str]
    weight: Optional[float]
    volume: Optional[float]
    price: float
    stock: int

    class Config:
        from_attributes = True


class ProductReadWithVariants(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str]
    images: Optional[str]
    color: Optional[str]
    material: Optional[str]
    features: Optional[str]
    rating: float
    review_count: int
    tax_percent: float
    category_id: Optional[int]
    subcategory_id: Optional[int]
    product_type: Optional[ProductType]
    variants: List[ProductVariantRead] = []

    class Config:
        from_attributes = True
