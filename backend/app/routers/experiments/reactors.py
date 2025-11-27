"""
Reactor API router.

Reactors are the vessels where catalytic reactions and plasma experiments
are conducted. Each reactor has specific characteristics that affect
experimental results.

Endpoint Summary:
- GET    /api/reactors/           List reactors
- POST   /api/reactors/           Create new reactor
- GET    /api/reactors/{id}       Get reactor details
- PATCH  /api/reactors/{id}       Update reactor
- DELETE /api/reactors/{id}       Delete reactor
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.experiments.reactor import Reactor
from app.schemas.experiments.reactor import (
    ReactorCreate, ReactorUpdate, ReactorResponse
)

router = APIRouter(
    prefix="/api/reactors",
    tags=["Reactors"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[ReactorResponse])
def list_reactors(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in description"),
        min_volume: Optional[float] = Query(None, description="Minimum volume (mL)"),
        max_volume: Optional[float] = Query(None, description="Maximum volume (mL)"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List reactors with optional filtering.
    """

    query = db.query(Reactor)

    # Apply filters
    if search:
        query = query.filter(Reactor.description.ilike(f"%{search}%"))

    if min_volume is not None:
        query = query.filter(Reactor.volume >= min_volume)

    if max_volume is not None:
        query = query.filter(Reactor.volume <= max_volume)

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Reactor.experiments))

    # Order by ID
    query = query.order_by(Reactor.id)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{reactor_id}", response_model=ReactorResponse)
def get_reactor(
        reactor_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single reactor by ID.
    """

    query = db.query(Reactor)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Reactor.experiments))

    reactor = query.filter(Reactor.id == reactor_id).first()

    if reactor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reactor with ID {reactor_id} not found"
        )

    return reactor


@router.post("/", response_model=ReactorResponse, status_code=status.HTTP_201_CREATED)
def create_reactor(
        reactor: ReactorCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new reactor.
    """

    db_reactor = Reactor(**reactor.model_dump())
    db.add(db_reactor)

    try:
        db.commit()
        db.refresh(db_reactor)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_reactor


@router.patch("/{reactor_id}", response_model=ReactorResponse)
def update_reactor(
        reactor_id: int,
        reactor_update: ReactorUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a reactor.
    """

    db_reactor = db.query(Reactor).filter(Reactor.id == reactor_id).first()

    if db_reactor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reactor with ID {reactor_id} not found"
        )

    update_data = reactor_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_reactor, field, value)

    db.commit()
    db.refresh(db_reactor)

    return db_reactor


@router.delete("/{reactor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reactor(
        reactor_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a reactor.
    
    Will fail if reactor is referenced by any experiments
    (ON DELETE RESTRICT).
    """

    db_reactor = db.query(Reactor).filter(Reactor.id == reactor_id).first()

    if db_reactor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reactor with ID {reactor_id} not found"
        )

    # Check for references
    if db_reactor.experiment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete reactor: referenced by {db_reactor.experiment_count} experiments"
        )

    db.delete(db_reactor)
    db.commit()

    return None