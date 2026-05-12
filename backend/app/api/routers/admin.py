from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_user
from app.models.product import Product, Category, SubCategory, ProductVariant
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.services.order_service import cancel_order, record_status_change
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate, CategoryCreate, CategoryRead, SubCategoryCreate, SubCategoryRead, ProductVariantCreate, ProductVariantRead, ProductVariantUpdate
from app.schemas.order import OrderRead, OrderAdminRead, OrderCancelRequest, OrderStatusUpdate
from app.schemas.user import UserRead, UserReadWithOrderCount, UserRoleUpdate, DashboardStats, TopUser

router = APIRouter(prefix='/admin', tags=['Admin'])


# Category management
@router.get('/categories', response_model=list[CategoryRead])
def list_admin_categories(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    return db.query(Category).all()


@router.post('/categories', response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_admin_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    category = Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete('/categories/{category_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Category not found')
    db.delete(category)
    db.commit()


# SubCategory management
@router.get('/subcategories', response_model=list[SubCategoryRead])
def list_admin_subcategories(
    category_id: int | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    query = db.query(SubCategory)
    if category_id is not None:
        query = query.filter(SubCategory.category_id == category_id)
    return query.all()


@router.post('/subcategories', response_model=SubCategoryRead, status_code=status.HTTP_201_CREATED)
def create_admin_subcategory(
    subcategory_in: SubCategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    subcategory = SubCategory(**subcategory_in.model_dump())
    db.add(subcategory)
    db.commit()
    db.refresh(subcategory)
    return subcategory


@router.delete('/subcategories/{subcategory_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    subcategory = db.get(SubCategory, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='SubCategory not found')
    db.delete(subcategory)
    db.commit()


# Product Variant management
@router.get('/products/{product_id}/variants', response_model=list[ProductVariantRead])
def list_product_variants(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
    return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()


@router.post('/products/{product_id}/variants', response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
def create_product_variant(
    product_id: int,
    variant_in: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
    
    # Check if SKU already exists
    existing_sku = db.query(ProductVariant).filter(ProductVariant.sku == variant_in.sku).first()
    if existing_sku:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='SKU already exists')
    
    variant = ProductVariant(product_id=product_id, **variant_in.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put('/variants/{variant_id}', response_model=ProductVariantRead)
def update_product_variant(
    variant_id: int,
    variant_in: ProductVariantUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    variant = db.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Variant not found')
    
    update_data = variant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variant, key, value)
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.delete('/variants/{variant_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_product_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    variant = db.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Variant not found')
    db.delete(variant)
    db.commit()


# Product management
@router.get('/products', response_model=list[ProductRead])
def list_admin_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    return db.query(Product).offset(skip).limit(limit).all()


@router.post('/products', response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_admin_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put('/products/{product_id}', response_model=ProductRead)
def update_admin_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete('/products/{product_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
    db.delete(product)
    db.commit()


# Order management
@router.get('/orders', response_model=list[OrderAdminRead])
def list_admin_orders(
    skip: int = 0,
    limit: int = 100,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    query = db.query(Order).options(joinedload(Order.user))
    if user_id is not None:
        query = query.filter(Order.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@router.get('/orders/{order_id}', response_model=OrderAdminRead)
def get_admin_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Order not found')
    return order


@router.put('/orders/{order_id}/status', response_model=OrderAdminRead)
def update_admin_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Order not found')
    
    # Convert string status to OrderStatus enum member
    try:
        # The status_update.status is validated and normalized to lowercase by the schema
        order.status = OrderStatus[status_update.status.upper()]
    except KeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Invalid status: {status_update.status}')
    
    # Record the status change in history
    record_status_change(db, order, status_update.status.lower(), f"Admin update: {current_admin.name}")
    
    print(f"DEBUG: Admin updated order {order_id} status to {status_update.status}")
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.put('/orders/{order_id}/cancel', response_model=OrderAdminRead)
def admin_cancel_order(
    order_id: int,
    cancel_request: OrderCancelRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Order not found')

    try:
        cancel_order(order, cancel_request.reason)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Record the cancellation in history
    record_status_change(db, order, 'cancelled', f"Cancelled by admin: {cancel_request.reason}")

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# User management
@router.get('/users', response_model=list[UserReadWithOrderCount])
def list_admin_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    users_with_counts = (
        db.query(User, func.count(Order.id).label('total_orders'))
        .outerjoin(Order)
        .group_by(User.id)
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        UserReadWithOrderCount.model_validate(user).copy(update={'total_orders': int(total_orders)})
        for user, total_orders in users_with_counts
    ]


@router.get('/users/{user_id}', response_model=UserReadWithOrderCount)
def get_admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user_with_count = (
        db.query(User, func.count(Order.id).label('total_orders'))
        .outerjoin(Order)
        .filter(User.id == user_id)
        .group_by(User.id)
        .first()
    )
    if not user_with_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    user, total_orders = user_with_count
    return UserReadWithOrderCount.model_validate(user).copy(update={'total_orders': int(total_orders)})


@router.get('/users/{user_id}/orders', response_model=list[OrderAdminRead])
def list_admin_user_orders(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return (
        db.query(Order)
        .options(joinedload(Order.user))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.put('/users/{user_id}/role', response_model=UserRead)
def update_admin_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    user.role = role_update.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get('/dashboard', response_model=DashboardStats)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0

    top_users_query = (
        db.query(User.id, User.name, User.email, func.count(Order.id).label('total_orders'))
        .outerjoin(Order)
        .group_by(User.id)
        .order_by(func.count(Order.id).desc())
        .limit(5)
        .all()
    )

    top_users = [
        TopUser(id=user_id, name=name, email=email, total_orders=int(total_orders))
        for user_id, name, email, total_orders in top_users_query
    ]

    return DashboardStats(
        total_users=int(total_users),
        total_orders=int(total_orders),
        total_revenue=float(total_revenue),
        top_users=top_users,
    )
