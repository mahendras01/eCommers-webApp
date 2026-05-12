from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, Address as AddressSchema

router = APIRouter()

@router.get("/", response_model=List[AddressSchema])
def read_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all addresses for current user"""
    addresses = db.query(Address).filter(Address.user_id == current_user.id).all()
    return addresses

@router.post("/", response_model=AddressSchema)
def create_address(
    address: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new address"""
    # If this is the default address, unset others
    if address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True
        ).update({"is_default": False})

    db_address = Address(**address.dict(), user_id=current_user.id)
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

@router.put("/{address_id}", response_model=AddressSchema)
def update_address(
    address_id: int,
    address: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an address"""
    db_address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not db_address:
        raise HTTPException(status_code=404, detail="Address not found")

    # If setting as default, unset others
    if address.is_default and not db_address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True
        ).update({"is_default": False})

    for key, value in address.dict(exclude_unset=True).items():
        setattr(db_address, key, value)

    db.commit()
    db.refresh(db_address)
    return db_address

@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an address"""
    db_address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not db_address:
        raise HTTPException(status_code=404, detail="Address not found")

    # If deleting default address, set another as default if exists
    if db_address.is_default:
        other_address = db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.id != address_id
        ).first()
        if other_address:
            other_address.is_default = True

    db.delete(db_address)
    db.commit()
    return {"message": "Address deleted successfully"}

@router.get("/default", response_model=AddressSchema)
def get_default_address(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get default address for current user"""
    address = db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_default == True
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="No default address found")

    return address