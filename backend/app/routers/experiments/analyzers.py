"""
Analyzer API router.

Analyzers are instruments used to measure experimental outputs. This router
supports polymorphic handling of FTIR and OES analyzer subtypes.

The analyzer_type field determines which subtype is created/returned:
- 'ftir': FTIR (Fourier Transform Infrared) spectrometer
- 'oes': OES (Optical Emission Spectrometer)

Endpoint Summary:
- GET    /api/analyzers/           List analyzers (all types)
- POST   /api/analyzers/           Create analyzer (type from body)
- GET    /api/analyzers/{id}       Get analyzer details
- PATCH  /api/analyzers/{id}       Update analyzer
- DELETE /api/analyzers/{id}       Delete analyzer

Type-specific endpoints:
- GET    /api/analyzers/ftir/      List FTIR analyzers only
- GET    /api/analyzers/oes/       List OES analyzers only
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Union

from app.database import get_db
from app.models.experiments.analyzer import Analyzer, FTIR, OES
from app.schemas.experiments.analyzer import (
    AnalyzerResponse,
    FTIRCreate, FTIRUpdate, FTIRResponse,
    OESCreate, OESUpdate, OESResponse,
    AnalyzerCreateUnion, AnalyzerResponseUnion
)

router = APIRouter(
    prefix="/api/analyzers",
    tags=["Analyzers"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[AnalyzerResponseUnion])
def list_analyzers(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in name and description"),
        analyzer_type: Optional[str] = Query(None, description="Filter by type: ftir, oes"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List analyzers with optional filtering.
    
    Returns polymorphic results - FTIR and OES analyzers with their
    type-specific fields.
    """

    query = db.query(Analyzer)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Analyzer.name.ilike(search_pattern)) |
            (Analyzer.description.ilike(search_pattern))
        )

    if analyzer_type:
        if analyzer_type not in ('ftir', 'oes'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analyzer_type: {analyzer_type}. Must be 'ftir' or 'oes'"
            )
        query = query.filter(Analyzer.analyzer_type == analyzer_type)

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Analyzer.experiments))

    # Order by name
    query = query.order_by(Analyzer.name)

    return query.offset(skip).limit(limit).all()


@router.get("/ftir/", response_model=List[FTIRResponse])
def list_ftir_analyzers(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    List FTIR analyzers only.
    """

    query = db.query(FTIR)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (FTIR.name.ilike(search_pattern)) |
            (FTIR.description.ilike(search_pattern))
        )

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(FTIR.experiments))

    query = query.order_by(FTIR.name)

    return query.offset(skip).limit(limit).all()


@router.get("/oes/", response_model=List[OESResponse])
def list_oes_analyzers(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    List OES analyzers only.
    """

    query = db.query(OES)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (OES.name.ilike(search_pattern)) |
            (OES.description.ilike(search_pattern))
        )

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(OES.experiments))

    query = query.order_by(OES.name)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{analyzer_id}", response_model=AnalyzerResponseUnion)
def get_analyzer(
        analyzer_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single analyzer by ID.
    
    Returns the full polymorphic type with all type-specific fields.
    """

    query = db.query(Analyzer)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Analyzer.experiments))

    analyzer = query.filter(Analyzer.id == analyzer_id).first()

    if analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analyzer with ID {analyzer_id} not found"
        )

    return analyzer


@router.post("/", response_model=AnalyzerResponseUnion, status_code=status.HTTP_201_CREATED)
def create_analyzer(
        analyzer: AnalyzerCreateUnion,
        db: Session = Depends(get_db)
):
    """
    Create a new analyzer.
    
    The analyzer_type field determines which subtype is created:
    - 'ftir': Creates FTIR analyzer with path_length, resolution, interval, scans
    - 'oes': Creates OES analyzer with integration_time, scans
    """

    data = analyzer.model_dump()
    analyzer_type = data.pop('analyzer_type')

    if analyzer_type == 'ftir':
        db_analyzer = FTIR(**data, analyzer_type='ftir')
    elif analyzer_type == 'oes':
        db_analyzer = OES(**data, analyzer_type='oes')
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid analyzer_type: {analyzer_type}"
        )

    db.add(db_analyzer)

    try:
        db.commit()
        db.refresh(db_analyzer)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_analyzer


@router.patch("/{analyzer_id}", response_model=AnalyzerResponseUnion)
def update_analyzer(
        analyzer_id: int,
        analyzer_update: Union[FTIRUpdate, OESUpdate],
        db: Session = Depends(get_db)
):
    """
    Update an analyzer.
    
    Updates are applied based on the existing analyzer type.
    The analyzer_type cannot be changed after creation.
    """

    db_analyzer = db.query(Analyzer).filter(Analyzer.id == analyzer_id).first()

    if db_analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analyzer with ID {analyzer_id} not found"
        )

    update_data = analyzer_update.model_dump(exclude_unset=True)

    # Validate type-specific fields
    if isinstance(db_analyzer, FTIR):
        valid_fields = {'name', 'description', 'path_length', 'resolution', 'interval', 'scans'}
    elif isinstance(db_analyzer, OES):
        valid_fields = {'name', 'description', 'integration_time', 'scans'}
    else:
        valid_fields = {'name', 'description'}

    invalid_fields = set(update_data.keys()) - valid_fields
    if invalid_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid fields for {db_analyzer.analyzer_type} analyzer: {invalid_fields}"
        )

    for field, value in update_data.items():
        setattr(db_analyzer, field, value)

    db.commit()
    db.refresh(db_analyzer)

    return db_analyzer


@router.delete("/{analyzer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analyzer(
        analyzer_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete an analyzer.
    
    Will fail if analyzer is referenced by any experiments
    (ON DELETE RESTRICT).
    """

    db_analyzer = db.query(Analyzer).filter(Analyzer.id == analyzer_id).first()

    if db_analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analyzer with ID {analyzer_id} not found"
        )

    # Check for references
    if db_analyzer.experiment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete analyzer: referenced by {db_analyzer.experiment_count} experiments"
        )

    db.delete(db_analyzer)
    db.commit()

    return None