"""
Chemical API router.

Chemicals represent raw materials and reagents used in synthesis methods.
This router provides CRUD operations for managing the chemical inventory.

Endpoint Summary:
- GET    /api/chemicals/           List with filtering
- POST   /api/chemicals/           Create new chemical
- GET    /api/chemicals/{id}       Get details
- PATCH  /api/chemicals/{id}       Update
- DELETE /api/chemicals/{id}       Delete (fails if in use)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.chemical import Chemical
from app.schemas.catalysts.chemical import (
    ChemicalCreate, ChemicalUpdate, ChemicalResponse
)

router = APIRouter(
    prefix="/api/chemicals",
    tags=["Chemicals"]
)


@router.get("/", response_model=List[ChemicalResponse])
def list_chemicals(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in name, formula, CAS"),
        include: Optional[str] = Query(None, description="Relationships: methods"),
        db: Session = Depends(get_db)
):
    """
    List chemicals with search and relationship inclusion.
    
    Search matches against:
    - Chemical name
    - Molecular formula
    - CAS number
    """

    query = db.query(Chemical)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Chemical.name.ilike(search_pattern)) |
            (Chemical.formula.ilike(search_pattern)) |
            (Chemical.cas_number.ilike(search_pattern))
        )

    if include and 'methods' in include:
        query = query.options(joinedload(Chemical.methods))

    query = query.order_by(Chemical.name)

    return query.offset(skip).limit(limit).all()


@router.get("/{chemical_id}", response_model=ChemicalResponse)
def get_chemical(
        chemical_id: int,
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single chemical by ID.
    """

    query = db.query(Chemical)

    if include and 'methods' in include:
        query = query.options(joinedload(Chemical.methods))

    chemical = query.filter(Chemical.id == chemical_id).first()

    if chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    return chemical


@router.post("/", response_model=ChemicalResponse, status_code=status.HTTP_201_CREATED)
def create_chemical(
        chemical: ChemicalCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new chemical.
    
    Chemical names must be unique.
    """

    # Check for duplicate name
    existing = db.query(Chemical).filter(Chemical.name == chemical.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chemical with name '{chemical.name}' already exists"
        )

    db_chemical = Chemical(**chemical.model_dump())
    db.add(db_chemical)

    try:
        db.commit()
        db.refresh(db_chemical)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chemical with this name already exists"
        )

    return db_chemical


@router.patch("/{chemical_id}", response_model=ChemicalResponse)
def update_chemical(
        chemical_id: int,
        chemical_update: ChemicalUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a chemical with partial data.
    """

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()

    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    update_data = chemical_update.model_dump(exclude_unset=True)

    # Check for name uniqueness if updating name
    if 'name' in update_data:
        existing = db.query(Chemical).filter(
            Chemical.name == update_data['name'],
            Chemical.id != chemical_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chemical with name '{update_data['name']}' already exists"
            )

    for field, value in update_data.items():
        setattr(db_chemical, field, value)

    db.commit()
    db.refresh(db_chemical)

    return db_chemical


@router.delete("/{chemical_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chemical(
        chemical_id: int,
        force: bool = Query(False, description="Force delete even if in use"),
        db: Session = Depends(get_db)
):
    """
    Delete a chemical.
    
    Fails if the chemical is used by any methods unless force=True.
    """

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()

    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    if not force and db_chemical.is_in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chemical is used by {db_chemical.method_count} methods. "
                   "Use force=true to delete anyway."
        )

    db.delete(db_chemical)
    db.commit()

    return None
