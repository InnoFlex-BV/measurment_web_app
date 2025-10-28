"""
Pydantic schemas for Experiment entity.

Experiments are the central entity and have the most complex schemas because
they can include nested measurements, observations, and files in responses.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# Import related schemas for nested data
from app.schemas.measurement import MeasurementResponse
from app.schemas.observation import ObservationResponse
from app.schemas.file import FileResponse


class ExperimentBase(BaseModel):
    """
    Base schema for experiments containing common fields.
    """

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Short descriptive title of the experiment"
    )

    description: Optional[str] = Field(
        None,
        description="Detailed description of purpose and methodology"
    )

    experiment_date: datetime = Field(
        ...,
        description="When the experiment was actually performed"
    )

    # Environmental conditions use Decimal for precision
    temperature_celsius: Optional[Decimal] = Field(
        None,
        ge=-273.15,  # Can't go below absolute zero
        le=1000,     # Reasonable upper limit for lab work
        description="Temperature in Celsius during the experiment"
    )

    pressure_atm: Optional[Decimal] = Field(
        None,
        gt=0,  # Pressure must be positive
        le=100,  # Reasonable upper limit
        description="Atmospheric pressure in atmospheres"
    )

    humidity_percent: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Relative humidity as a percentage"
    )

    # Additional conditions stored as flexible JSON
    additional_conditions: Optional[dict] = Field(
        None,
        description="Other environmental conditions as key-value pairs"
    )

    notes: Optional[str] = Field(
        None,
        description="General notes or conclusions about the experiment"
    )


class ExperimentCreate(ExperimentBase):
    """
    Schema for creating a new experiment.
    
    Requires experiment_type_id and user_id to establish relationships.
    Status defaults to 'planned' if not provided.
    """

    experiment_type_id: int = Field(
        ...,
        gt=0,
        description="ID of the experiment type (Titration, Spectroscopy, etc.)"
    )

    # user_id could be derived from authentication in a real system
    # For now, we require it explicitly
    user_id: int = Field(
        ...,
        gt=0,
        description="ID of the user conducting the experiment"
    )

    status: Optional[str] = Field(
        default='planned',
        pattern="^(planned|in_progress|completed|failed|cancelled)$",
        description="Current status of the experiment"
    )


class ExperimentUpdate(BaseModel):
    """
    Schema for updating an experiment.
    
    All fields optional to allow partial updates. You might want to update
    just the status or just add notes without changing other fields.
    """

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None)
    experiment_type_id: Optional[int] = Field(None, gt=0)
    experiment_date: Optional[datetime] = Field(None)
    temperature_celsius: Optional[Decimal] = Field(None, ge=-273.15, le=1000)
    pressure_atm: Optional[Decimal] = Field(None, gt=0, le=100)
    humidity_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    additional_conditions: Optional[dict] = Field(None)
    status: Optional[str] = Field(
        None,
        pattern="^(planned|in_progress|completed|failed|cancelled)$"
    )
    notes: Optional[str] = Field(None)


class ExperimentResponse(ExperimentBase):
    """
    Schema for experiment data returned by the API.
    
    This is the most complex response schema because it can include
    nested related data like measurements, observations, and files.
    The include_details parameter in API routes controls whether
    these nested collections are populated.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_type_id: int = Field(..., description="ID of the experiment type")
    user_id: int = Field(..., description="ID of the user who conducted it")
    status: str = Field(..., description="Current status")
    created_at: datetime = Field(..., description="When this record was created")
    updated_at: datetime = Field(..., description="When this record was last modified")

    # These nested fields are optional because you might want a lightweight
    # response that doesn't include all the related data
    # List[] notation means a list of that schema type
    measurements: Optional[List[MeasurementResponse]] = Field(
        default=None,
        description="All measurements taken during this experiment"
    )

    observations: Optional[List[ObservationResponse]] = Field(
        default=None,
        description="All observations made during this experiment"
    )

    files: Optional[List[FileResponse]] = Field(
        default=None,
        description="All files attached to this experiment"
    )

    model_config = ConfigDict(from_attributes=True)


class ExperimentListResponse(BaseModel):
    """
    Simplified schema for experiment lists.
    
    When returning a list of experiments, we don't want to include all
    the nested measurements, observations, and files because that would
    be massive amounts of data. This lightweight schema is optimized for lists.
    """

    id: int
    title: str
    experiment_type_id: int
    user_id: int
    experiment_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)