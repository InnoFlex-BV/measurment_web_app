"""
Pydantic schemas for Catalyst entity.

Catalysts are the central entities representing synthesized catalyst materials.
They connect to methods (how made), other catalysts (derivation chains),
samples (prepared portions), characterizations, observations, and users.

The schemas handle:
- Inventory tracking (yield_amount, remaining_amount)
- Self-referential relationships (input/output catalysts)
- Multiple many-to-many relationships
- Validation for business rules
"""

from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any

from app.schemas.catalysts.method import MethodSimple


class CatalystBase(BaseModel):
    """
    Base schema for catalysts with common fields.
    """

    # Catalyst name/identifier
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Catalyst name/identifier",
        examples=["Pt-TiO2-5wt%", "Au/CeO2-calcined-500C"]
    )

    # Method reference
    method_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of synthesis method"
    )

    # Inventory tracking
    yield_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Amount produced (grams)",
        examples=["5.0000", "10.5000"]
    )

    remaining_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Amount remaining (grams)",
        examples=["4.5000", "8.0000"]
    )

    # Storage location
    storage_location: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Physical storage location",
        examples=["Desiccator A", "Freezer B, Shelf 2"]
    )

    # Notes
    notes: Optional[str] = Field(
        None,
        description="Additional notes about this catalyst"
    )

    @model_validator(mode='after')
    def validate_remaining_vs_yield(self):
        """Ensure remaining amount doesn't exceed yield."""
        if self.remaining_amount > self.yield_amount:
            raise ValueError('remaining_amount cannot exceed yield_amount')
        return self


class CatalystCreate(CatalystBase):
    """
    Schema for creating a new catalyst.
    
    Supports establishing relationships during creation:
    - input_catalyst_ids: Catalysts this was derived from
    - characterization_ids: Initial characterizations
    - observation_ids: Initial observations
    - user_ids: Users who created this catalyst
    """

    # Derivation relationships
    input_catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of catalysts this was derived from"
    )

    # Analysis relationships (Phase 2)
    characterization_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of characterizations to associate"
    )

    observation_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of observations to associate"
    )

    # User tracking
    user_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of users who created this catalyst"
    )


class CatalystUpdate(BaseModel):
    """
    Schema for updating a catalyst.
    
    All fields optional for partial updates.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    method_id: Optional[int] = Field(None, gt=0)
    yield_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    remaining_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    storage_location: Optional[str] = Field(None, min_length=1, max_length=255)
    notes: Optional[str] = None

    # Relationship updates
    input_catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace input catalyst associations"
    )

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


class CatalystSimple(BaseModel):
    """
    Simplified schema for nested representations.
    
    Used in derivation chains and other nested contexts.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Catalyst name")
    storage_location: str = Field(..., description="Storage location")
    remaining_amount: Decimal = Field(..., description="Amount remaining")

    model_config = ConfigDict(from_attributes=True)


class CatalystResponse(CatalystBase):
    """
    Complete schema for catalyst data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    is_depleted: bool = Field(
        default=False,
        description="Whether catalyst is fully consumed"
    )

    usage_percentage: float = Field(
        default=0.0,
        description="Percentage of original yield consumed"
    )

    sample_count: int = Field(
        default=0,
        description="Number of samples prepared from this catalyst"
    )

    characterization_count: int = Field(
        default=0,
        description="Number of characterizations performed"
    )

    # Optional nested relationships
    method: Optional[MethodSimple] = Field(
        default=None,
        description="Synthesis method (included when requested)"
    )

    input_catalysts: Optional[List["CatalystSimple"]] = Field(
        default=None,
        description="Source catalysts (included when requested)"
    )

    output_catalysts: Optional[List["CatalystSimple"]] = Field(
        default=None,
        description="Derived catalysts (included when requested)"
    )

    samples: Optional[List[Any]] = Field(
        default=None,
        description="Samples from this catalyst (included when requested)"
    )

    characterizations: Optional[List[Any]] = Field(
        default=None,
        description="Characterizations (included when requested)"
    )

    observations: Optional[List[Any]] = Field(
        default=None,
        description="Observations (included when requested)"
    )

    users: Optional[List[Any]] = Field(
        default=None,
        description="Users who worked on this (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Pt-TiO2-5wt%",
                    "method_id": 1,
                    "yield_amount": "5.0000",
                    "remaining_amount": "4.2000",
                    "storage_location": "Desiccator A, Shelf 1",
                    "notes": "Prepared for photocatalysis testing",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "is_depleted": False,
                    "usage_percentage": 16.0,
                    "sample_count": 3,
                    "characterization_count": 5
                }
            ]
        }
    )


# Rebuild model to resolve forward references
CatalystResponse.model_rebuild()
