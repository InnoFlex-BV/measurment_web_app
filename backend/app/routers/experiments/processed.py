"""
Processed API router.

Processed records store calculated/derived results from experiments,
particularly performance metrics like DRE (Decomposition/Removal Efficiency)
and EY (Energy Yield).

Endpoint Summary:
- GET    /api/processed/           List processed results
- POST   /api/processed/           Create new processed result (with optional experiment linking)
- GET    /api/processed/{id}       Get processed details
- PATCH  /api/processed/{id}       Update processed result (with optional experiment linking)
- DELETE /api/processed/{id}       Delete processed result

Relationship Endpoints:
- POST   /api/processed/{id}/experiments/{experiment_id}   Attach experiment
- DELETE /api/processed/{id}/experiments/{experiment_id}   Detach experiment
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.experiments.processed import Processed
from app.models.experiments.experiment import Experiment
from app.schemas.experiments.processed import (
    ProcessedCreate, ProcessedUpdate, ProcessedResponse
)

router = APIRouter(
    prefix="/api/processed",
    tags=["Processed Results"]
)


# =============================================================================
# Helper Functions
# =============================================================================

def _validate_and_get_experiments(
        db: Session,
        experiment_ids: List[int]
) -> List[Experiment]:
    """
    Validate that all experiment IDs exist and return the experiment objects.

    Args:
        db: Database session
        experiment_ids: List of experiment IDs to validate

    Returns:
        List of Experiment objects

    Raises:
        HTTPException: If any experiment IDs are not found
    """
    if not experiment_ids:
        return []

    experiments = db.query(Experiment).filter(
        Experiment.id.in_(experiment_ids)
    ).all()

    found_ids = {exp.id for exp in experiments}
    missing_ids = set(experiment_ids) - found_ids

    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Experiments not found: {sorted(missing_ids)}"
        )

    return experiments


def _link_experiments_to_processed(
        db: Session,
        processed_id: int,
        experiments: List[Experiment]
) -> None:
    """
    Link experiments to a processed result by setting their processed_table_id.

    Args:
        db: Database session
        processed_id: ID of the processed result
        experiments: List of Experiment objects to link
    """
    for experiment in experiments:
        experiment.processed_table_id = processed_id


def _unlink_all_experiments(
        db: Session,
        processed_id: int
) -> int:
    """
    Unlink all experiments from a processed result.

    Args:
        db: Database session
        processed_id: ID of the processed result

    Returns:
        Number of experiments unlinked
    """
    count = db.query(Experiment).filter(
        Experiment.processed_table_id == processed_id
    ).update({Experiment.processed_table_id: None})

    return count


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

    Optionally link experiments by providing experiment_ids. Each specified
    experiment will have its processed_table_id set to the new record.

    Example request body:
    ```json
    {
        "dre": 87.5,
        "ey": 15.23,
        "experiment_ids": [1, 2, 3]
    }
    ```
    """
    # Extract experiment_ids before creating the model
    experiment_ids = processed.experiment_ids
    data = processed.model_dump(exclude={'experiment_ids'})

    # Validate experiments exist (if provided)
    experiments_to_link = []
    if experiment_ids:
        experiments_to_link = _validate_and_get_experiments(db, experiment_ids)

    # Create the processed record
    db_processed = Processed(**data)
    db.add(db_processed)

    try:
        # Flush to get the ID without committing
        db.flush()

        # Link experiments if provided
        if experiments_to_link:
            _link_experiments_to_processed(db, db_processed.id, experiments_to_link)

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

    When experiment_ids is provided:
    - All currently linked experiments are unlinked first
    - The specified experiments are then linked to this processed result
    - Use an empty list [] to unlink all experiments without linking new ones
    - Omit the field entirely to leave experiment links unchanged

    Example - Link new experiments:
    ```json
    {
        "dre": 90.5,
        "experiment_ids": [4, 5, 6]
    }
    ```

    Example - Unlink all experiments:
    ```json
    {
        "experiment_ids": []
    }
    ```
    """

    db_processed = db.query(Processed).filter(Processed.id == processed_id).first()

    if db_processed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed result with ID {processed_id} not found"
        )

    update_data = processed_update.model_dump(exclude_unset=True)

    # Handle experiment linking separately
    experiment_ids = update_data.pop('experiment_ids', None)

    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_processed, field, value)

    # Handle experiment relationships if explicitly provided
    # Note: experiment_ids=None means "not provided" (don't change)
    #       experiment_ids=[] means "unlink all experiments"
    if experiment_ids is not None:
        # First, unlink all currently linked experiments
        _unlink_all_experiments(db, processed_id)

        # Then link the new experiments (if any)
        if experiment_ids:
            experiments_to_link = _validate_and_get_experiments(db, experiment_ids)
            _link_experiments_to_processed(db, processed_id, experiments_to_link)

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


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post(
    "/{processed_id}/experiments/{experiment_id}",
    status_code=status.HTTP_200_OK,
    summary="Attach Experiment to Processed",
    response_description="Confirmation message"
)
def attach_experiment_to_processed(
        processed_id: int,
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Attach an experiment to this processed result.

    Sets the experiment's processed_table_id to this processed record.
    If the experiment is already linked to a different processed result,
    it will be re-linked to this one.
    """
    # Verify processed exists
    processed = db.query(Processed).filter(Processed.id == processed_id).first()
    if not processed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed with ID {processed_id} not found"
        )

    # Verify experiment exists
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    # Check if already linked to this processed
    if experiment.processed_table_id == processed_id:
        return {
            "message": f"Experiment {experiment_id} is already attached to Processed {processed_id}"
        }

    # Attach
    old_processed_id = experiment.processed_table_id
    experiment.processed_table_id = processed_id
    db.commit()

    if old_processed_id:
        return {
            "message": f"Experiment {experiment_id} re-linked from Processed {old_processed_id} to Processed {processed_id}"
        }

    return {
        "message": f"Experiment {experiment_id} attached to Processed {processed_id}"
    }


@router.delete(
    "/{processed_id}/experiments/{experiment_id}",
    status_code=status.HTTP_200_OK,
    summary="Detach Experiment from Processed",
    response_description="Confirmation message"
)
def detach_experiment_from_processed(
        processed_id: int,
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Detach an experiment from this processed result.

    Sets the experiment's processed_table_id to NULL.
    """
    # Verify processed exists
    processed = db.query(Processed).filter(Processed.id == processed_id).first()
    if not processed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Processed with ID {processed_id} not found"
        )

    # Find experiment that is linked to this processed
    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.processed_table_id == processed_id
    ).first()

    if not experiment:
        # Check if experiment exists at all
        experiment_exists = db.query(Experiment).filter(
            Experiment.id == experiment_id
        ).first()

        if not experiment_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment with ID {experiment_id} not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Experiment {experiment_id} is not attached to Processed {processed_id}"
            )

    experiment.processed_table_id = None
    db.commit()

    return {
        "message": f"Experiment {experiment_id} detached from Processed {processed_id}"
    }
