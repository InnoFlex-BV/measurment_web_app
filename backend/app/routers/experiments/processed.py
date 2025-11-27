"""
Processed API router.

Processed records store calculated/derived results from experiments,
particularly performance metrics like DRE (Decomposition/Removal Efficiency)
and EY (Energy Yield).

Endpoint Summary:
- GET    /api/processed/           List processed results
- POST   /api/processed/           Create new processed result
- GET    /api/processed/{id}       Get processed details
- PATCH  /api/processed/{id}       Update processed result
- DELETE /api/processed/{id}       Delete processed result
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.experiments.processed import Processed
from app.schemas.experiments.processed import (
    ProcessedCreate, ProcessedUpdate, ProcessedResponse
)

router = APIRouter(
    prefix="/api/processed",
    tags=["Processed Results"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[ProcessedResponse])
def list_processed(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        min_dre: Optional[float] = Query(None, description="Minimum DRE value"),
        max_dre: Optional[float] = Query(None, description="Maximum DRE value"),
        min_ey: Optional[float] = Query(None, description="Minimum EY value"),
        max_ey: Optional[float] = Query(None, description="Maximum EY value"),
        complete_only: bool = Query(False, description="Only records with both DRE and EY"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List processed results with optional filtering.
    """

    query = db.query(Processed)

    # Apply filters
    if min_dre is not None:
        query = query.filter(Processed.dre >= min_dre)

    if max_dre is not None:
        query = query.filter(Processed.dre <= max_dre)

    if min_ey is not None:
        query = query.filter(Processed.ey >= min_ey)

    if max_ey is not None:
        query = query.filter(Processed.ey <= max_ey)

    if complete_only:
        query = query.filter(
            Processed.dre.isnot(None),
            Processed.ey.isnot(None)
        )

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Processed.experiments))

    # Order by ID
    query = query.order_by(Processed.id)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{processed_id}", response_model=ProcessedResponse)
def get_processed(
        processed_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single processed result by ID.
    """

    query = db.query(Processed)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Processed.experiments))

    processed = query.filter(Processed.id == processed_id).first()

    if processed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed result with ID {processed_id} not found"
        )

    return processed


@router.post("/", response_model=ProcessedResponse, status_code=status.HTTP_201_CREATED)
def create_processed(
        processed: ProcessedCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new processed result record.
    """

    db_processed = Processed(**processed.model_dump())
    db.add(db_processed)

    try:
        db.commit()
        db.refresh(db_processed)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_processed


@router.patch("/{processed_id}", response_model=ProcessedResponse)
def update_processed(
        processed_id: int,
        processed_update: ProcessedUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a processed result.
    """

    db_processed = db.query(Processed).filter(Processed.id == processed_id).first()

    if db_processed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed result with ID {processed_id} not found"
        )

    update_data = processed_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_processed, field, value)

    db.commit()
    db.refresh(db_processed)

    return db_processed


@router.delete("/{processed_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processed(
        processed_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a processed result.
    
    Note: Experiments referencing this will have their processed_table_id
    set to NULL (ON DELETE SET NULL).
    """

    db_processed = db.query(Processed).filter(Processed.id == processed_id).first()

    if db_processed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed result with ID {processed_id} not found"
        )

    db.delete(db_processed)
    db.commit()

    return None