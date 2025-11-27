"""
Contaminant API router.

Contaminants are the target compounds that experiments aim to remove
or decompose. They're linked to experiments through a junction table
that also stores the concentration (ppm).

Endpoint Summary:
- GET    /api/contaminants/           List contaminants
- POST   /api/contaminants/           Create new contaminant
- GET    /api/contaminants/{id}       Get contaminant details
- PATCH  /api/contaminants/{id}       Update contaminant
- DELETE /api/contaminants/{id}       Delete contaminant
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.reference.contaminant import Contaminant
from app.schemas.reference.contaminant import (
    ContaminantCreate, ContaminantUpdate, ContaminantResponse
)

router = APIRouter(
    prefix="/api/contaminants",
    tags=["Contaminants"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[ContaminantResponse])
def list_contaminants(
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
    List contaminants with optional filtering.
    """

    query = db.query(Contaminant)

    # Apply filters
    if search:
        query = query.filter(Contaminant.name.ilike(f"%{search}%"))

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Contaminant.experiments))

    # Order by name
    query = query.order_by(Contaminant.name)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{contaminant_id}", response_model=ContaminantResponse)
def get_contaminant(
        contaminant_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single contaminant by ID.
    """

    query = db.query(Contaminant)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Contaminant.experiments))

    contaminant = query.filter(Contaminant.id == contaminant_id).first()

    if contaminant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contaminant with ID {contaminant_id} not found"
        )

    return contaminant


@router.post("/", response_model=ContaminantResponse, status_code=status.HTTP_201_CREATED)
def create_contaminant(
        contaminant: ContaminantCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new contaminant.
    """

    db_contaminant = Contaminant(**contaminant.model_dump())
    db.add(db_contaminant)

    try:
        db.commit()
        db.refresh(db_contaminant)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_contaminant


@router.patch("/{contaminant_id}", response_model=ContaminantResponse)
def update_contaminant(
        contaminant_id: int,
        contaminant_update: ContaminantUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a contaminant.
    """

    db_contaminant = db.query(Contaminant).filter(Contaminant.id == contaminant_id).first()

    if db_contaminant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contaminant with ID {contaminant_id} not found"
        )

    update_data = contaminant_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_contaminant, field, value)

    db.commit()
    db.refresh(db_contaminant)

    return db_contaminant


@router.delete("/{contaminant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contaminant(
        contaminant_id: int,
        force: bool = Query(False, description="Force delete even if referenced"),
        db: Session = Depends(get_db)
):
    """
    Delete a contaminant.
    
    By default, fails if contaminant is referenced by experiments.
    Use force=true to delete anyway (CASCADE will remove junction entries).
    """

    db_contaminant = db.query(Contaminant).filter(Contaminant.id == contaminant_id).first()

    if db_contaminant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contaminant with ID {contaminant_id} not found"
        )

    # Check for references
    if not force and db_contaminant.experiment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contaminant is referenced by {db_contaminant.experiment_count} experiments. "
                   "Use force=true to delete anyway."
        )

    db.delete(db_contaminant)
    db.commit()

    return None