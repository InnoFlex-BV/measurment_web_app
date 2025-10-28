"""
Pydantic schemas for ExperimentType entity.

ExperimentTypes are relatively simple entities that categorize experiments.
They're used as a controlled vocabulary to ensure consistency.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class ExperimentTypeBase(BaseModel):
    """
    Base schema for experiment types containing common fields.
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of the experiment type (e.g., Titration, Spectroscopy)"
    )

    description: Optional[str] = Field(
        None,
        description="Detailed description of what this experiment type means"
    )


class ExperimentTypeCreate(ExperimentTypeBase):
    """
    Schema for creating a new experiment type.
    
    Inherits name and description from base. No additional fields needed
    because is_active defaults to True and created_at is auto-generated.
    """
    pass  # No additional fields needed for creation


class ExperimentTypeUpdate(BaseModel):
    """
    Schema for updating an experiment type.
    
    All fields optional to allow partial updates. Commonly used to
    deactivate old experiment types by setting is_active to False.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None, description="Whether this type is available")


class ExperimentTypeResponse(ExperimentTypeBase):
    """
    Schema for experiment type data returned by the API.
    
    Includes all fields including generated ones like id and timestamps.
    """

    id: int = Field(..., description="Unique identifier")
    is_active: bool = Field(..., description="Whether this type is currently active")
    created_at: datetime = Field(..., description="When this type was created")

    model_config = ConfigDict(from_attributes=True)