"""
Waveform API router.

Waveforms define electrical signal parameters for plasma experiments,
including AC and pulsing characteristics that control discharge behavior.

Endpoint Summary:
- GET    /api/waveforms/           List waveforms
- POST   /api/waveforms/           Create new waveform
- GET    /api/waveforms/{id}       Get waveform details
- PATCH  /api/waveforms/{id}       Update waveform
- DELETE /api/waveforms/{id}       Delete waveform
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.experiments.waveform import Waveform
from app.schemas.experiments.waveform import (
    WaveformCreate, WaveformUpdate, WaveformResponse
)

router = APIRouter(
    prefix="/api/waveforms",
    tags=["Waveforms"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[WaveformResponse])
def list_waveforms(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in waveform names"),
        pulsed_only: Optional[bool] = Query(None, description="Filter pulsed waveforms only"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: plasma_experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List waveforms with optional filtering.
    """

    query = db.query(Waveform)

    # Apply filters
    if search:
        query = query.filter(Waveform.name.ilike(f"%{search}%"))

    if pulsed_only:
        query = query.filter(Waveform.pulsing_frequency.isnot(None))

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'plasma_experiments' in include_rels:
            query = query.options(joinedload(Waveform.plasma_experiments))

    # Order by name
    query = query.order_by(Waveform.name)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{waveform_id}", response_model=WaveformResponse)
def get_waveform(
        waveform_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single waveform by ID.
    """

    query = db.query(Waveform)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'plasma_experiments' in include_rels:
            query = query.options(joinedload(Waveform.plasma_experiments))

    waveform = query.filter(Waveform.id == waveform_id).first()

    if waveform is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Waveform with ID {waveform_id} not found"
        )

    return waveform


@router.post("/", response_model=WaveformResponse, status_code=status.HTTP_201_CREATED)
def create_waveform(
        waveform: WaveformCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new waveform configuration.
    """

    db_waveform = Waveform(**waveform.model_dump())
    db.add(db_waveform)

    try:
        db.commit()
        db.refresh(db_waveform)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_waveform


@router.patch("/{waveform_id}", response_model=WaveformResponse)
def update_waveform(
        waveform_id: int,
        waveform_update: WaveformUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a waveform configuration.
    """

    db_waveform = db.query(Waveform).filter(Waveform.id == waveform_id).first()

    if db_waveform is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Waveform with ID {waveform_id} not found"
        )

    update_data = waveform_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_waveform, field, value)

    db.commit()
    db.refresh(db_waveform)

    return db_waveform


@router.delete("/{waveform_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_waveform(
        waveform_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a waveform.
    
    Will fail if waveform is referenced by any plasma experiments
    (ON DELETE RESTRICT).
    """

    db_waveform = db.query(Waveform).filter(Waveform.id == waveform_id).first()

    if db_waveform is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Waveform with ID {waveform_id} not found"
        )

    # Check for references
    if db_waveform.experiment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete waveform: referenced by {db_waveform.experiment_count} experiments"
        )

    db.delete(db_waveform)
    db.commit()

    return None