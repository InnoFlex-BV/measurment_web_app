"""
Pydantic schemas for Measurement entity.

Measurements represent quantitative data from experiments.
The combination of value and unit is critical for meaningful data.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal


class MeasurementBase(BaseModel):
    """
    Base schema for measurements containing common fields.
    """

    measurement_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Descriptive name of what was measured (e.g., 'Initial pH', 'Final mass')"
    )

    # Decimal is used instead of float to maintain exact precision
    # This is critical for scientific data where float rounding errors are unacceptable
    measurement_value: Decimal = Field(
        ...,
        description="The measured value as an exact decimal"
    )

    unit: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Unit of measurement (e.g., 'mL', 'g', 'mol/L', '°C')"
    )

    uncertainty: Optional[Decimal] = Field(
        None,
        description="Measurement uncertainty or error bar if tracked"
    )

    # The metadata field uses dict type to accept arbitrary JSON
    # In Python 3.9+, we can use dict directly as a type hint
    measurement_metadata: Optional[dict] = Field(
        None,
        description="Additional metadata like instrument used, calibration info"
    )


class MeasurementCreate(MeasurementBase):
    """
    Schema for creating a new measurement.
    
    When creating through the measurements endpoint, experiment_id might be
    in the URL path rather than the request body. When creating measurements
    as part of creating an experiment, experiment_id is handled automatically.
    """

    # measured_at is optional because it defaults to current time if not provided
    measured_at: Optional[datetime] = Field(
        None,
        description="When this measurement was taken (defaults to now)"
    )


class MeasurementUpdate(BaseModel):
    """
    Schema for updating a measurement.
    
    In practice, measurements are rarely updated after creation because
    they represent historical data. But the capability exists if needed.
    """

    measurement_name: Optional[str] = Field(None, min_length=1, max_length=100)
    measurement_value: Optional[Decimal] = Field(None)
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    uncertainty: Optional[Decimal] = Field(None)
    metadata: Optional[dict] = Field(None)


class MeasurementResponse(MeasurementBase):
    """
    Schema for measurement data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_id: int = Field(..., description="ID of the experiment this measurement belongs to")
    measured_at: datetime = Field(..., description="When this measurement was taken")
    created_at: datetime = Field(..., description="When this record was created")

    model_config = ConfigDict(from_attributes=True)