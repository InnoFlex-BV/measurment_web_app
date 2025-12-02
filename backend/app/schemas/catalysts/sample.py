"""
Pydantic schemas for Sample entity.

Samples represent prepared catalyst materials for testing. The schemas
handle the complexity of samples having multiple optional relationships
(catalyst, support, method) and tracking inventory through yield and
remaining amounts.

Schema Hierarchy:
- SampleBase: Common fields for all sample operations
- SampleCreate: Fields for creating new samples
- SampleUpdate: Optional fields for partial updates
- SampleSimple: Minimal representation for nested responses
- SampleResponse: Complete sample data for API responses

The schemas support:
- Inventory tracking (yield_amount, remaining_amount)
- Relationship inclusion (catalyst, support, method, characterizations)
- Validation for numeric constraints

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "CatalystSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.catalysts.catalyst import CatalystSimple
    from app.schemas.catalysts.support import SupportResponse
    from app.schemas.catalysts.method import MethodSimple
    from app.schemas.analysis.characterization import CharacterizationSimple
    from app.schemas.analysis.observation import ObservationSimple
    from app.schemas.experiments.experiment import ExperimentSimple
    from app.schemas.core.user import UserSimple


class SampleBase(BaseModel):
    """
    Base schema for samples containing core attributes.
    
    Samples track prepared catalyst materials with optional links to:
    - Source catalyst (catalyst_id)
    - Support material (support_id)  
    - Preparation method (method_id)
    """

    # Sample name/identifier
    name: Optional[str] = Field(
        None,
        max_length=255,
        description="Sample identifier or name",
        examples=["Pt/Al2O3-5wt%-batch1", "TiO2-P25-calcined"]
    )

    # Foreign key references (all optional)
    catalyst_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of source catalyst"
    )

    support_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of support material"
    )

    method_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of preparation method"
    )

    # Inventory tracking
    yield_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Amount of sample produced (grams)",
        examples=["2.5000", "10.0000"]
    )

    remaining_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Amount of sample remaining (grams)",
        examples=["2.3500", "8.0000"]
    )

    # Storage information
    storage_location: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Physical storage location",
        examples=["Desiccator A, Shelf 2", "Glovebox 1, Rack B"]
    )

    # Notes
    notes: Optional[str] = Field(
        None,
        description="Additional notes about this sample"
    )

    @field_validator('remaining_amount')
    @classmethod
    def validate_remaining_not_negative(cls, v):
        """Ensure remaining amount is not negative."""
        if v < 0:
            raise ValueError('remaining_amount cannot be negative')
        return v

    @model_validator(mode='after')
    def validate_remaining_vs_yield(self):
        """Ensure remaining amount doesn't exceed yield."""
        if self.remaining_amount > self.yield_amount:
            raise ValueError('remaining_amount cannot exceed yield_amount')
        return self


class SampleCreate(SampleBase):
    """
    Schema for creating a new sample.
    
    Inherits validation from SampleBase. Optionally accepts lists of
    IDs for establishing relationships during creation.
    """

    # Optional: Associate with characterizations during creation
    characterization_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of characterizations to associate with this sample"
    )

    # Optional: Associate with observations during creation
    observation_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of observations to associate with this sample"
    )

    # Optional: Record which users created this sample
    user_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of users who created this sample"
    )


class SampleUpdate(BaseModel):
    """
    Schema for updating a sample.
    
    All fields are optional to support partial updates. Includes
    validation to ensure consistency when updating inventory values.
    """

    name: Optional[str] = Field(None, max_length=255)
    catalyst_id: Optional[int] = Field(None, gt=0)
    support_id: Optional[int] = Field(None, gt=0)
    method_id: Optional[int] = Field(None, gt=0)
    yield_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    remaining_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    storage_location: Optional[str] = Field(None, min_length=1, max_length=255)
    notes: Optional[str] = None

    # Relationship updates
    characterization_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace characterization associations"
    )

    observation_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace observation associations"
    )

    user_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace user associations"
    )


class SampleSimple(BaseModel):
    """
    Simplified schema for nested representations.
    
    Used when samples appear as nested data in other responses
    (e.g., in characterization or experiment responses).
    """

    id: int = Field(..., description="Unique identifier")
    name: Optional[str] = Field(None, description="Sample name")
    storage_location: str = Field(..., description="Storage location")
    remaining_amount: Decimal = Field(..., description="Amount remaining")

    model_config = ConfigDict(from_attributes=True)


class SampleResponse(SampleBase):
    """
    Complete schema for sample data returned by the API.
    
    Includes all base fields plus generated fields and optional
    nested relationships when requested via include parameter.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    is_depleted: bool = Field(
        default=False,
        description="Whether sample is fully consumed"
    )

    usage_percentage: float = Field(
        default=0.0,
        description="Percentage of original yield consumed"
    )

    # Optional nested relationships (populated via include parameter)
    catalyst: Optional["CatalystSimple"] = Field(
        default=None,
        description="Source catalyst (included when requested)"
    )

    support: Optional["SupportResponse"] = Field(
        default=None,
        description="Support material (included when requested)"
    )

    method: Optional["MethodSimple"] = Field(
        default=None,
        description="Preparation method (included when requested)"
    )

    characterizations: Optional[List["CharacterizationSimple"]] = Field(
        default=None,
        description="Associated characterizations (included when requested)"
    )

    observations: Optional[List["ObservationSimple"]] = Field(
        default=None,
        description="Associated observations (included when requested)"
    )

    experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Experiments using this sample (included when requested)"
    )

    users: Optional[List["UserSimple"]] = Field(
        default=None,
        description="Users who worked on this sample (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Pt/Al2O3-5wt%-batch1",
                    "catalyst_id": 1,
                    "support_id": 1,
                    "method_id": 1,
                    "yield_amount": "2.5000",
                    "remaining_amount": "2.1000",
                    "storage_location": "Desiccator A, Shelf 2",
                    "notes": "Prepared for BET analysis",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "is_depleted": False,
                    "usage_percentage": 16.0
                }
            ]
        }
    )
