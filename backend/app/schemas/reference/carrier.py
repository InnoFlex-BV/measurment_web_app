"""
Pydantic schemas for Carrier entity.

Carriers are the gases used as the main flow in experiments, carrying
the contaminants through the reactor. They're linked to experiments
through a junction table that also stores the ratio.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any


class CarrierBase(BaseModel):
    """
    Base schema for carriers.
    """

    # Carrier name
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Carrier gas name",
        examples=["N2", "Ar", "He", "Air", "O2"]
    )


class CarrierCreate(CarrierBase):
    """
    Schema for creating a new carrier.
    """
    pass


class CarrierUpdate(BaseModel):
    """
    Schema for updating a carrier.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)


class CarrierSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Carrier name")

    model_config = ConfigDict(from_attributes=True)


class CarrierWithRatio(CarrierSimple):
    """
    Carrier with flow ratio for experiment context.
    
    Used when returning carriers as part of experiment relationships.
    The ratio value comes from the junction table.
    """

    ratio: Optional[Decimal] = Field(
        None,
        description="Flow ratio (fraction or percentage) for this experiment"
    )


class CarrierResponse(CarrierBase):
    """
    Complete schema for carrier data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments using this carrier"
    )

    is_in_use: Optional[bool] = Field(
        default=None,
        description="Whether any experiments use this carrier"
    )

    # Optional relationships
    experiments: Optional[List[Any]] = Field(
        default=None,
        description="Experiments using this carrier (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "N2",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 25,
                    "is_in_use": True
                }
            ]
        }
    )


# Schema for adding carrier to experiment with ratio
class CarrierExperimentData(BaseModel):
    """
    Schema for linking a carrier to an experiment with flow ratio.
    
    Used in experiment create/update operations.
    """

    id: int = Field(..., gt=0, description="Carrier ID")
    ratio: Optional[Decimal] = Field(
        None,
        ge=0,
        le=1,
        description="Flow ratio (0-1 fraction)"
    )