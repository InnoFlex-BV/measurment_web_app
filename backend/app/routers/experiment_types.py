"""
API routes for experiment types.

These endpoints allow creating, reading, updating, and deleting experiment types.
Experiment types are used as a controlled vocabulary for categorizing experiments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.experiment_type import ExperimentType
from app.schemas.experiment_type import (
    ExperimentTypeCreate,
    ExperimentTypeUpdate,
    ExperimentTypeResponse
)

# Create a router instance
# This router will be included in the main FastAPI app
# The prefix is prepended to all routes defined on this router
# The tags list is used to group endpoints in the API documentation
router = APIRouter(
    prefix="/api/experiment-types",
    tags=["Experiment Types"]
)


@router.get("/", response_model=List[ExperimentTypeResponse])
def get_experiment_types(
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
        db: Session = Depends(get_db)
):
    """
    Retrieve a list of experiment types.
    
    This endpoint supports pagination through skip and limit parameters.
    By default, only active types are returned unless include_inactive is True.
    
    The response_model tells FastAPI to serialize the response using
    ExperimentTypeResponse schema. The List[] wrapper means this returns
    an array of experiment types.
    
    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        include_inactive: Whether to include deactivated types
        db: Database session (automatically injected by FastAPI)
    
    Returns:
        List of experiment type objects
    """

    # Start building the query
    query = db.query(ExperimentType)

    # Filter out inactive types unless explicitly requested
    # This is a business logic decision - inactive types exist for historical
    # data but shouldn't be used for new experiments
    if not include_inactive:
        query = query.filter(ExperimentType.is_active == True)

    # Apply pagination and fetch results
    # offset() skips records, limit() caps the number returned
    experiment_types = query.offset(skip).limit(limit).all()

    # FastAPI automatically serializes this to JSON using the response_model
    # The from_attributes=True in ExperimentTypeResponse's config allows this
    return experiment_types


@router.get("/{type_id}", response_model=ExperimentTypeResponse)
def get_experiment_type(
        type_id: int,
        db: Session = Depends(get_db)
):
    """
    Retrieve a single experiment type by ID.
    
    The {type_id} in the route path is a path parameter.
    FastAPI automatically extracts it from the URL and validates it's an integer.
    
    Args:
        type_id: The ID of the experiment type to retrieve
        db: Database session
    
    Returns:
        The experiment type object
        
    Raises:
        HTTPException(404): If the experiment type doesn't exist
    """

    # Query for the specific type
    experiment_type = db.query(ExperimentType).filter(
        ExperimentType.id == type_id
    ).first()

    # first() returns None if no match found
    # We raise a 404 error in that case
    if experiment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment type with id {type_id} not found"
        )

    return experiment_type


@router.post("/", response_model=ExperimentTypeResponse, status_code=status.HTTP_201_CREATED)
def create_experiment_type(
        experiment_type: ExperimentTypeCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new experiment type.
    
    The experiment_type parameter expects JSON in the request body that
    validates against ExperimentTypeCreate schema. FastAPI handles parsing
    and validation automatically.
    
    The status_code parameter changes the default response code from 200 to 201,
    which is the semantic correct code for resource creation.
    
    Args:
        experiment_type: The experiment type data from request body
        db: Database session
    
    Returns:
        The newly created experiment type with generated ID and timestamps
        
    Raises:
        HTTPException(400): If an experiment type with this name already exists
    """

    # Check if a type with this name already exists
    # This prevents duplicate names which would violate the unique constraint
    existing = db.query(ExperimentType).filter(
        ExperimentType.name == experiment_type.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Experiment type '{experiment_type.name}' already exists"
        )

    # Create a new ExperimentType model instance from the validated schema
    # The **experiment_type.model_dump() unpacks the Pydantic model into keyword arguments
    # model_dump() is the Pydantic v2 way to get a dictionary of the model's data
    db_experiment_type = ExperimentType(**experiment_type.model_dump())

    # Add to the session (stages the insert)
    db.add(db_experiment_type)

    # Commit the transaction (actually writes to database)
    # After commit, the database generates the ID and timestamps
    db.commit()

    # Refresh to get the generated values back from the database
    # Without this, db_experiment_type.id would be None
    db.refresh(db_experiment_type)

    # Return the complete object including generated fields
    return db_experiment_type


@router.patch("/{type_id}", response_model=ExperimentTypeResponse)
def update_experiment_type(
        type_id: int,
        experiment_type_update: ExperimentTypeUpdate,
        db: Session = Depends(get_db)
):
    """
    Update an experiment type.
    
    This is a PATCH endpoint, meaning it supports partial updates.
    Only the fields provided in the request are updated.
    
    Args:
        type_id: ID of the experiment type to update
        experiment_type_update: Fields to update
        db: Database session
    
    Returns:
        The updated experiment type
        
    Raises:
        HTTPException(404): If the experiment type doesn't exist
    """

    # Find the existing type
    db_experiment_type = db.query(ExperimentType).filter(
        ExperimentType.id == type_id
    ).first()

    if db_experiment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment type with id {type_id} not found"
        )

    # Get the update data as a dictionary, excluding unset fields
    # exclude_unset=True means only fields actually provided in the request
    # are included. Fields that weren't provided are excluded entirely.
    update_data = experiment_type_update.model_dump(exclude_unset=True)

    # Apply each field update
    # setattr() sets object attributes dynamically
    for field, value in update_data.items():
        setattr(db_experiment_type, field, value)

    # Commit the changes
    db.commit()
    db.refresh(db_experiment_type)

    return db_experiment_type


@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment_type(
        type_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete an experiment type.
    
    Note: This will fail if any experiments use this type due to the
    RESTRICT foreign key constraint. In that case, you should deactivate
    the type instead using PATCH with is_active=False.
    
    Args:
        type_id: ID of the experiment type to delete
        db: Database session
    
    Returns:
        None (204 No Content response)
        
    Raises:
        HTTPException(404): If the experiment type doesn't exist
        HTTPException(400): If experiments reference this type
    """

    db_experiment_type = db.query(ExperimentType).filter(
        ExperimentType.id == type_id
    ).first()

    if db_experiment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment type with id {type_id} not found"
        )

    try:
        db.delete(db_experiment_type)
        db.commit()
    except Exception as e:
        # If deletion fails (likely due to foreign key constraint),
        # rollback the transaction and return an error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete experiment type that is used by experiments. "
                   "Consider deactivating it instead."
        )

    # 204 responses have no body, so we return None
    return None