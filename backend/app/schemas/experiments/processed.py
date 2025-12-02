"""
Pydantic schemas for Processed entity.

Processed records store calculated/derived results from experiments,
particularly performance metrics like DRE (Decomposition/Removal Efficiency)
and EY (Energy Yield).

Note: The database table has no timestamps - these are calculated results.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "ExperimentSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.experiments.experiment import ExperimentSimple


class ProcessedBase(BaseModel):
    """
    Base schema for processed experiment results.
    """

    # Decomposition/Removal Efficiency
    dre: Optional[Decimal] = Field(
        None,
        description="Decomposition/Removal Efficiency (%)",
        examples=["85.5000", "92.3400"]
    )

    # Energy Yield
    ey: Optional[Decimal] = Field(
        None,
        description="Energy Yield (g/kWh or mol/kWh)",
        examples=["12.5000", "8.7500"]
    )


class ProcessedCreate(ProcessedBase):
    """
    Schema for creating a new processed result record.
    """
    pass


class ProcessedUpdate(BaseModel):
    """
    Schema for updating processed results.
    
    All fields optional for partial updates.
    """

    dre: Optional[Decimal] = None
    ey: Optional[Decimal] = None


class ProcessedSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    dre: Optional[Decimal] = Field(None, description="DRE value")
    ey: Optional[Decimal] = Field(None, description="EY value")

    model_config = ConfigDict(from_attributes=True)


class ProcessedResponse(ProcessedBase):
    """
    Complete schema for processed data returned by the API.
    
    Note: No timestamps since the database table doesn't have them.
    """

    id: int = Field(..., description="Unique identifier")

    # Computed properties
    has_dre: Optional[bool] = Field(
        default=None,
        description="Whether DRE value is recorded"
    )

    has_ey: Optional[bool] = Field(
        default=None,
        description="Whether EY value is recorded"
    )

    is_complete: Optional[bool] = Field(
        default=None,
        description="Whether both metrics are recorded"
    )

    # Optional relationships - using string forward refs
    experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Experiments with these results (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "dre": "87.5000",
                    "ey": "15.2300",
                    "has_dre": True,
                    "has_ey": True,
                    "is_complete": True
                }
            ]
        }
    )
