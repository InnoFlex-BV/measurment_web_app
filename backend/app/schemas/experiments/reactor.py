"""
Pydantic schemas for Reactor entity.

Reactors are the vessels where catalytic reactions and plasma experiments
are conducted. Each reactor has specific characteristics that affect
experimental results.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "ExperimentSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.experiments.experiment import ExperimentSimple


class ReactorBase(BaseModel):
    """
    Base schema for reactors with core attributes.
    """

    # Reactor description
    description: Optional[str] = Field(
        None,
        description="Detailed description of reactor design and configuration",
        examples=["Quartz DBD reactor, 10mm gap, powered electrode 50mm diameter"]
    )

    # Reactor volume
    volume: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Reactor volume (typically mL)",
        examples=["100", "250.5"]
    )


class ReactorCreate(ReactorBase):
    """
    Schema for creating a new reactor.
    """
    pass


class ReactorUpdate(BaseModel):
    """
    Schema for updating a reactor.
    
    All fields optional for partial updates.
    """

    description: Optional[str] = None
    volume: Optional[Decimal] = Field(None, ge=0)


class ReactorSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    volume: Optional[Decimal] = Field(None, description="Volume")
    description: Optional[str] = Field(None, description="Description preview")

    model_config = ConfigDict(from_attributes=True)


class ReactorResponse(ReactorBase):
    """
    Complete schema for reactor data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments using this reactor"
    )

    is_in_use: Optional[bool] = Field(
        default=None,
        description="Whether reactor is referenced by experiments"
    )

    volume_display: Optional[str] = Field(
        default=None,
        description="Human-readable volume with units"
    )

    # Optional relationships - using string forward refs
    experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Experiments using this reactor (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "description": "Quartz DBD reactor, 10mm gap, mesh ground electrode",
                    "volume": "150.0000",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 12,
                    "is_in_use": True,
                    "volume_display": "150.00 mL"
                }
            ]
        }
    )
