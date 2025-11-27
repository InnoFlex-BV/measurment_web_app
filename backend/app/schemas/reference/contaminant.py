"""
Pydantic schemas for Contaminant entity.

Contaminants are the target compounds that experiments aim to remove
or decompose. They're linked to experiments through a junction table
that also stores the concentration (ppm).
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any


class ContaminantBase(BaseModel):
    """
    Base schema for contaminants.
    """

    # Contaminant name
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Contaminant compound name",
        examples=["Toluene", "Acetaldehyde", "NOx", "NH3"]
    )


class ContaminantCreate(ContaminantBase):
    """
    Schema for creating a new contaminant.
    """
    pass


class ContaminantUpdate(BaseModel):
    """
    Schema for updating a contaminant.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)


class ContaminantSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Contaminant name")

    model_config = ConfigDict(from_attributes=True)


class ContaminantWithPpm(ContaminantSimple):
    """
    Contaminant with concentration for experiment context.
    
    Used when returning contaminants as part of experiment relationships.
    The ppm value comes from the junction table.
    """

    ppm: Optional[Decimal] = Field(
        None,
        description="Concentration in ppm for this experiment"
    )


class ContaminantResponse(ContaminantBase):
    """
    Complete schema for contaminant data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments targeting this contaminant"
    )

    is_in_use: Optional[bool] = Field(
        default=None,
        description="Whether any experiments target this contaminant"
    )

    # Optional relationships
    experiments: Optional[List[Any]] = Field(
        default=None,
        description="Experiments targeting this contaminant (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Toluene",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 15,
                    "is_in_use": True
                }
            ]
        }
    )


# Schema for adding contaminant to experiment with ppm
class ContaminantExperimentData(BaseModel):
    """
    Schema for linking a contaminant to an experiment with concentration.
    
    Used in experiment create/update operations.
    """

    id: int = Field(..., gt=0, description="Contaminant ID")
    ppm: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Concentration in ppm"
    )