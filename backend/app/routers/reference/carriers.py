"""
Carrier API router.

Carriers are the gases used as the main flow in experiments, carrying
the contaminants through the reactor. They're linked to experiments
through a junction table that also stores the ratio.

Endpoint Summary:
- GET    /api/carriers/           List carriers
- POST   /api/carriers/           Create new carrier
- GET    /api/carriers/{id}       Get carrier details
- PATCH  /api/carriers/{id}       Update carrier
- DELETE /api/carriers/{id}       Delete carrier
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.reference.carrier import Carrier
from app.schemas.reference.carrier import (
    CarrierCreate, CarrierUpdate, CarrierResponse
)

router = APIRouter(
    prefix="/api/carriers",
    tags=["Carriers"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[CarrierResponse])
def list_carriers(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in name"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List carriers with optional filtering.
    """

    query = db.query(Carrier)

    # Apply filters
    if search:
        query = query.filter(Carrier.name.ilike(f"%{search}%"))

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Carrier.experiments))

    # Order by name
    query = query.order_by(Carrier.name)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{carrier_id}", response_model=CarrierResponse)
def get_carrier(
        carrier_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single carrier by ID.
    """

    query = db.query(Carrier)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Carrier.experiments))

    carrier = query.filter(Carrier.id == carrier_id).first()

    if carrier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carrier with ID {carrier_id} not found"
        )

    return carrier


@router.post("/", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
def create_carrier(
        carrier: CarrierCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new carrier.
    """

    db_carrier = Carrier(**carrier.model_dump())
    db.add(db_carrier)

    try:
        db.commit()
        db.refresh(db_carrier)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_carrier


@router.patch("/{carrier_id}", response_model=CarrierResponse)
def update_carrier(
        carrier_id: int,
        carrier_update: CarrierUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a carrier.
    """

    db_carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()

    if db_carrier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carrier with ID {carrier_id} not found"
        )

    update_data = carrier_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_carrier, field, value)

    db.commit()
    db.refresh(db_carrier)

    return db_carrier


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_carrier(
        carrier_id: int,
        force: bool = Query(False, description="Force delete even if referenced"),
        db: Session = Depends(get_db)
):
    """
    Delete a carrier.
    
    By default, fails if carrier is referenced by experiments.
    Use force=true to delete anyway (CASCADE will remove junction entries).
    """

    db_carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()

    if db_carrier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carrier with ID {carrier_id} not found"
        )

    # Check for references
    if not force and db_carrier.experiment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Carrier is referenced by {db_carrier.experiment_count} experiments. "
                   "Use force=true to delete anyway."
        )

    db.delete(db_carrier)
    db.commit()

    return None
