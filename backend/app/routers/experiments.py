"""
API routes for experiments.

These endpoints handle the full lifecycle of laboratory experiments including
creating experiments, recording measurements and observations, and attaching files.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.experiment import Experiment
from app.models.experiment_type import ExperimentType
from app.models.user import User
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentListResponse
)

router = APIRouter(
    prefix="/api/experiments",
    tags=["Experiments"]
)


@router.get("/", response_model=List[ExperimentListResponse])
def get_experiments(
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = Query(None, alias="status"),
        user_id: Optional[int] = None,
        experiment_type_id: Optional[int] = None,
        db: Session = Depends(get_db)
):
    """
    Retrieve a list of experiments with optional filtering.
    
    This endpoint returns a lightweight list without nested data.
    Use GET /experiments/{id} to get full details including measurements.
    
    Query parameters allow filtering by status, user, and experiment type.
    The Query() function lets us customize parameter behavior - in this case
    using 'status' as the parameter name even though 'status' is a Python keyword,
    so we use 'status_filter' as the Python variable name with alias="status".
    
    Args:
        skip: Pagination offset
        limit: Maximum results to return
        status_filter: Filter by status (planned, in_progress, completed, etc.)
        user_id: Filter by user who conducted the experiment
        experiment_type_id: Filter by experiment type
        db: Database session
    
    Returns:
        List of experiments (lightweight version without nested data)
    """

    # Start building the query
    query = db.query(Experiment)

    # Apply filters if provided
    # Each filter is optional, only added to the query if the parameter was provided
    if status_filter:
        query = query.filter(Experiment.status == status_filter)

    if user_id:
        query = query.filter(Experiment.user_id == user_id)

    if experiment_type_id:
        query = query.filter(Experiment.experiment_type_id == experiment_type_id)

    # Order by experiment date descending (most recent first)
    query = query.order_by(Experiment.experiment_date.desc())

    # Apply pagination
    experiments = query.offset(skip).limit(limit).all()

    return experiments


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(
        experiment_id: int,
        include_details: bool = True,
        db: Session = Depends(get_db)
):
    """
    Retrieve a single experiment by ID with full details.
    
    The include_details parameter controls whether related data
    (measurements, observations, files) is included in the response.
    
    When include_details is True, we use SQLAlchemy's joinedload to
    eagerly load the related data in a single query with JOINs rather
    than making separate queries for each relationship (N+1 problem).
    
    Args:
        experiment_id: The experiment ID
        include_details: Whether to include measurements, observations, and files
        db: Database session
    
    Returns:
        Complete experiment with or without nested data
        
    Raises:
        HTTPException(404): If experiment not found
    """

    # Build the query
    query = db.query(Experiment)

    # If details requested, eagerly load relationships
    # joinedload() tells SQLAlchemy to use JOINs to fetch related data
    # This prevents the N+1 query problem where you'd make separate queries
    # for each relationship
    if include_details:
        query = query.options(
            joinedload(Experiment.measurements),
            joinedload(Experiment.observations),
            joinedload(Experiment.files)
        )

    experiment = query.filter(Experiment.id == experiment_id).first()

    if experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id {experiment_id} not found"
        )

    return experiment


@router.post("/", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(
        experiment: ExperimentCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new experiment.
    
    This validates that the referenced experiment_type_id and user_id exist
    before creating the experiment. Foreign key constraints would prevent
    invalid references anyway, but explicit validation gives better error messages.
    
    Args:
        experiment: Experiment data from request body
        db: Database session
    
    Returns:
        The newly created experiment
        
    Raises:
        HTTPException(400): If experiment_type_id or user_id don't exist
    """

    # Verify experiment type exists
    experiment_type = db.query(ExperimentType).filter(
        ExperimentType.id == experiment.experiment_type_id
    ).first()

    if not experiment_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Experiment type with id {experiment.experiment_type_id} not found"
        )

    # Verify user exists
    user = db.query(User).filter(User.id == experiment.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with id {experiment.user_id} not found"
        )

    # Create the experiment
    db_experiment = Experiment(**experiment.model_dump())

    db.add(db_experiment)
    db.commit()
    db.refresh(db_experiment)

    return db_experiment


@router.patch("/{experiment_id}", response_model=ExperimentResponse)
def update_experiment(
        experiment_id: int,
        experiment_update: ExperimentUpdate,
        db: Session = Depends(get_db)
):
    """
    Update an experiment (partial update).
    
    Args:
        experiment_id: The experiment ID
        experiment_update: Fields to update
        db: Database session
    
    Returns:
        The updated experiment
        
    Raises:
        HTTPException(404): If experiment not found
        HTTPException(400): If trying to set invalid foreign keys
    """

    db_experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id
    ).first()

    if db_experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id {experiment_id} not found"
        )

    # Get update data excluding unset fields
    update_data = experiment_update.model_dump(exclude_unset=True)

    # If updating experiment_type_id, verify it exists
    if "experiment_type_id" in update_data:
        experiment_type = db.query(ExperimentType).filter(
            ExperimentType.id == update_data["experiment_type_id"]
        ).first()
        if not experiment_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Experiment type with id {update_data['experiment_type_id']} not found"
            )

    # Apply updates
    for field, value in update_data.items():
        setattr(db_experiment, field, value)

    db.commit()
    db.refresh(db_experiment)

    return db_experiment


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete an experiment.
    
    Because of CASCADE foreign keys, this also deletes all associated
    measurements, observations, and file records. The actual file bytes
    would need to be deleted separately (not implemented here).
    
    Args:
        experiment_id: The experiment ID
        db: Database session
    
    Returns:
        None
        
    Raises:
        HTTPException(404): If experiment not found
    """

    db_experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id
    ).first()

    if db_experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id {experiment_id} not found"
        )

    db.delete(db_experiment)
    db.commit()

    return None