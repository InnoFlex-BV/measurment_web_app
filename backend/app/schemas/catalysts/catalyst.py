"""
Pydantic schemas for Catalyst entity.

Catalysts are the central research artifacts with complex relationships
to methods, chemicals (through methods), other catalysts (derivation),
characterizations, and observations. The schemas balance expressiveness
with API usability, using IDs for relationships in create/update operations
and optionally including full nested objects in responses.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List


class CatalystBase(BaseModel):
    """
    Base schema for catalysts containing core attributes.
    
    These attributes directly describe the catalyst material and its
    physical inventory status.
    """

    # Name or identifier for this catalyst
    # Could be systematic ("CAT-047") or descriptive ("TiO2-Pt-500C")
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name or identifier for this catalyst",
        examples=["CAT-001", "Pt-TiO2-Calcined-500C"]
    )

    # Yield from synthesis
    # Using Decimal for exact precision in scientific measurements
    # The ge (greater than or equal) constraint ensures non-negative values
    yield_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Yield amount from synthesis",
        examples=[15.7523, 8.2100]
    )

    # Current remaining amount in storage
    # Should never exceed yield unless additional synthesis occurred
    remaining_amount: Decimal = Field(
        ...,
        ge=0,
        decimal_places=4,
        description="Current remaining amount in storage",
        examples=[15.7523, 3.4000]
    )

    # Physical storage location for retrieving the material
    storage_location: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Physical location where this catalyst is stored",
        examples=["Freezer A, Shelf 2, Box 3", "Desiccator Cabinet B"]
    )

    # Optional notes about the catalyst
    notes: Optional[str] = Field(
        None,
        description="Additional notes about synthesis, properties, or handling"
    )

    # Custom validator to ensure remaining amount doesn't exceed yield
    # This is business logic validation beyond simple type checking
    @field_validator('remaining_amount')
    @classmethod
    def validate_remaining_not_exceeds_yield(cls, v, info):
        """
        Validate that remaining amount doesn't exceed original yield.
        
        This validator runs during Pydantic's validation process and has
        access to other field values through the info.data dictionary.
        It enforces the business rule that you can't have more material
        than you originally created (unless you do additional synthesis,
        which would be a new catalyst record).
        """
        # info.data contains values of other fields that were validated already
        # We need to check if yield_amount exists because during partial updates
        # it might not be present
        if 'yield_amount' in info.data:
            yield_amount = info.data['yield_amount']
            if v > yield_amount:
                raise ValueError(
                    f'Remaining amount ({v}) cannot exceed yield amount ({yield_amount})'
                )
        return v


class CatalystCreate(CatalystBase):
    """
    Schema for creating a new catalyst.
    
    When creating a catalyst, you specify the method used and optionally
    reference input catalysts if this catalyst was derived from others.
    The relationships are specified through IDs rather than nested objects
    for simplicity and predictability.
    """

    # Foreign key to the method used to create this catalyst
    # Optional because a catalyst might not have a documented method
    # (though in practice you'd want to record this for reproducibility)
    method_id: Optional[int] = Field(
        None,
        description="ID of the method used to create this catalyst"
    )

    # Optional list of catalyst IDs that were used as inputs
    # Example: If you calcined Catalyst A to create Catalyst B,
    # Catalyst B's input_catalyst_ids would contain A's ID
    input_catalyst_ids: List[int] = Field(
        default=[],
        description="IDs of catalysts used as inputs to create this one"
    )


class CatalystUpdate(BaseModel):
    """
    Schema for updating a catalyst.
    
    All fields optional for partial updates. Commonly used to update
    remaining_amount as material is consumed, or storage_location if
    the material is moved to a different location.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)

    method_id: Optional[int] = Field(
        None,
        description="Updated method reference"
    )

    # Note: yield_amount typically shouldn't change after creation because
    # it records what was originally synthesized. But we include it for
    # corrections if the original value was recorded incorrectly.
    yield_amount: Optional[Decimal] = Field(None, ge=0)

    remaining_amount: Optional[Decimal] = Field(None, ge=0)

    storage_location: Optional[str] = Field(None, min_length=1, max_length=255)

    notes: Optional[str] = Field(None)

    # Can update the list of input catalysts, replacing the entire list
    input_catalyst_ids: Optional[List[int]] = Field(None)


class CatalystResponse(CatalystBase):
    """
    Schema for catalyst data returned by the API.
    
    This can include nested related data like the method object,
    input catalysts, characterizations, and observations. Whether
    these relationships are populated depends on query parameters
    that control the level of detail returned.
    """

    id: int = Field(..., description="Unique identifier")

    # Foreign key value
    method_id: Optional[int] = Field(None, description="ID of the synthesis method")

    created_at: datetime = Field(..., description="When this catalyst was synthesized")
    updated_at: datetime = Field(..., description="When this record was last modified")

    # Optional nested relationships
    # These are populated based on request parameters like ?include=method,characterizations
    # Using forward references (strings) to avoid circular imports

    method: Optional["MethodResponse"] = Field(
        None,
        description="Complete method object (included when requested)"
    )

    input_catalysts: Optional[List["CatalystResponse"]] = Field(
        None,
        description="Catalysts used as inputs to create this one"
    )

    output_catalysts: Optional[List["CatalystResponse"]] = Field(
        None,
        description="Catalysts created using this one as input"
    )

    # We'll add characterizations and observations relationships in Phase 2

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "CAT-001",
                    "method_id": 1,
                    "yield_amount": 15.7523,
                    "remaining_amount": 15.7523,
                    "storage_location": "Freezer A, Shelf 2",
                    "notes": "White powder, good crystallinity",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "method": None,
                    "input_catalysts": None,
                    "output_catalysts": None
                }
            ]
        }
    )


# Import related schemas at the bottom to avoid circular dependencies
from app.schemas.catalysts.method import MethodResponse

# Rebuild models to resolve forward references
CatalystResponse.model_rebuild()