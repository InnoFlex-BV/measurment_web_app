"""
Pydantic schemas for Observation entity.

Observations capture qualitative data and notes about experiments.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class ObservationBase(BaseModel):
    """
    Base schema for observations containing common fields.
    """

    observation_text: str = Field(
        ...,
        min_length=1,
        description="The observation text - can be as detailed as needed"
    )

    observation_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Category like 'color_change', 'precipitation', 'gas_evolution'"
    )

    severity: Optional[str] = Field(
        default='normal',
        pattern="^(low|normal|high|critical)$",
        description="Importance level of this observation"
    )


class ObservationCreate(ObservationBase):
    """
    Schema for creating a new observation.
    """

    # observed_at is required for observations because knowing when something
    # happened during an experiment is often critical
    observed_at: datetime = Field(
        ...,
        description="When during the experiment this observation was made"
    )


class ObservationUpdate(BaseModel):
    """
    Schema for updating an observation.
    """

    observation_text: Optional[str] = Field(None, min_length=1)
    observation_type: Optional[str] = Field(None, max_length=50)
    severity: Optional[str] = Field(None, pattern="^(low|normal|high|critical)$")
    observed_at: Optional[datetime] = Field(None)


class ObservationResponse(ObservationBase):
    """
    Schema for observation data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_id: int = Field(..., description="ID of the experiment")
    observed_at: datetime = Field(..., description="When this observation was made")
    created_at: datetime = Field(..., description="When this record was created")

    model_config = ConfigDict(from_attributes=True)