"""
API routes for measurements.

Measurements are nested under experiments. They can be created, updated,
and deleted independently, but always belong to an experiment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.measurement import Measurement
from app.models.experiment import Experiment
from app.schemas.measurement import (
    MeasurementCreate,
    MeasurementUpdate,
    MeasurementResponse
)

router = APIRouter(
    prefix="/api/experiments/{experiment_id}/measurements",
    tags=["Measurements"]
)


@router.get("/", response_model=List[MeasurementResponse])
def get_measurements(
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all measurements for an experiment.
    
    The experiment_id comes from the URL path. This nested resource pattern
    makes the API more RESTful and self-documenting.
    
    Args:
        experiment_id: The parent experiment ID
        db: Database session
    
    Returns:
        List of measurements for this experiment
        
    Raises:
        HTTPException(404): If experiment not found
    """

    # Verify experiment exists
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id {experiment_id} not found"
        )

    # Query measurements for this experiment
    measurements = db.query(Measurement).filter(
        Measurement.experiment_id == experiment_id
    ).order_by(Measurement.measured_at).all()

    return measurements


@router.post("/", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
        experiment_id: int,
        measurement: MeasurementCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new measurement for an experiment.
    
    The experiment_id is taken from the URL path and automatically
    associated with the measurement.
    
    Args:
        experiment_id: The parent experiment ID
        measurement: Measurement data
        db: Database session
    
    Returns:
        The created measurement
        
    Raises:
        HTTPException(404): If experiment not found
    """

    # Verify experiment exists
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id {experiment_id} not found"
        )

    # Create measurement with experiment_id from path
    measurement_data = measurement.model_dump()
    measurement_data["experiment_id"] = experiment_id

    db_measurement = Measurement(**measurement_data)

    db.add(db_measurement)
    db.commit()
    db.refresh(db_measurement)

    return db_measurement


@router.patch("/{measurement_id}", response_model=MeasurementResponse)
def update_measurement(
        experiment_id: int,
        measurement_id: int,
        measurement_update: MeasurementUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a measurement.
    
    Both experiment_id and measurement_id are in the path to maintain
    the nested resource structure.
    
    Args:
        experiment_id: The parent experiment ID
        measurement_id: The measurement ID
        measurement_update: Fields to update
        db: Database session
    
    Returns:
        The updated measurement
        
    Raises:
        HTTPException(404): If measurement not found or doesn't belong to this experiment
    """

    db_measurement = db.query(Measurement).filter(
        Measurement.id == measurement_id,
        Measurement.experiment_id == experiment_id
    ).first()

    if db_measurement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Measurement with id {measurement_id} not found for experiment {experiment_id}"
        )

    update_data = measurement_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_measurement, field, value)

    db.commit()
    db.refresh(db_measurement)

    return db_measurement


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
        experiment_id: int,
        measurement_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a measurement.
    
    Args:
        experiment_id: The parent experiment ID
        measurement_id: The measurement ID
        db: Database session
    
    Returns:
        None
        
    Raises:
        HTTPException(404): If measurement not found
    """

    db_measurement = db.query(Measurement).filter(
        Measurement.id == measurement_id,
        Measurement.experiment_id == experiment_id
    ).first()

    if db_measurement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Measurement with id {measurement_id} not found"
        )

    db.delete(db_measurement)
    db.commit()

    return None