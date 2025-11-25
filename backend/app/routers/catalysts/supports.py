"""
Support API router.

Supports represent substrate materials for catalysts (alumina, silica, etc.).
This router provides CRUD operations for managing support materials.

Endpoint Summary:
- GET    /api/supports/           List with filtering
- POST   /api/supports/           Create new support
- GET    /api/supports/{id}       Get details
- PATCH  /api/supports/{id}       Update
- DELETE /api/supports/{id}       Delete (fails if in use)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.support import Support
from app.schemas.catalysts.support import (
    SupportCreate, SupportUpdate, SupportResponse
)

router = APIRouter(
    prefix="/api/supports",
    tags=["Supports"]
)


@router.get("/", response_model=List[SupportResponse])
def list_supports(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in name and description"),
        include: Optional[str] = Query(None, description="Relationships: samples"),
        db: Session = Depends(get_db)
):
    """
    List supports with search and relationship inclusion.
    """

    query = db.query(Support)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Support.descriptive_name.ilike(search_pattern)) |
            (Support.description.ilike(search_pattern))
        )

    if include and 'samples' in include:
        query = query.options(joinedload(Support.samples))

    query = query.order_by(Support.descriptive_name)

    return query.offset(skip).limit(limit).all()


@router.get("/{support_id}", response_model=SupportResponse)
def get_support(
        support_id: int,
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single support by ID.
    """

    query = db.query(Support)

    if include and 'samples' in include:
        query = query.options(joinedload(Support.samples))

    support = query.filter(Support.id == support_id).first()

    if support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    return support


@router.post("/", response_model=SupportResponse, status_code=status.HTTP_201_CREATED)
def create_support(
        support: SupportCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new support material.
    
    Support names (descriptive_name) must be unique.
    """

    # Check for duplicate name
    existing = db.query(Support).filter(
        Support.descriptive_name == support.descriptive_name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Support with name '{support.descriptive_name}' already exists"
        )

    db_support = Support(**support.model_dump())
    db.add(db_support)

    try:
        db.commit()
        db.refresh(db_support)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Support with this name already exists"
        )

    return db_support


@router.patch("/{support_id}", response_model=SupportResponse)
def update_support(
        support_id: int,
        support_update: SupportUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a support with partial data.
    """

    db_support = db.query(Support).filter(Support.id == support_id).first()

    if db_support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    update_data = support_update.model_dump(exclude_unset=True)

    # Check for name uniqueness if updating name
    if 'descriptive_name' in update_data:
        existing = db.query(Support).filter(
            Support.descriptive_name == update_data['descriptive_name'],
            Support.id != support_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Support with name '{update_data['descriptive_name']}' already exists"
            )

    for field, value in update_data.items():
        setattr(db_support, field, value)

    db.commit()
    db.refresh(db_support)

    return db_support


@router.delete("/{support_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_support(
        support_id: int,
        force: bool = Query(False, description="Force delete even if in use"),
        db: Session = Depends(get_db)
):
    """
    Delete a support material.
    
    Fails if the support is used by any samples unless force=True.
    """

    db_support = db.query(Support).filter(Support.id == support_id).first()

    if db_support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    if not force and db_support.is_in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Support is used by {db_support.sample_count} samples. "
                   "Use force=true to delete anyway."
        )

    db.delete(db_support)
    db.commit()

    return None
