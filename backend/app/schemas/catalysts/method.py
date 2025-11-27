"""
Pydantic schemas for Method entity.

Methods document catalyst synthesis procedures. They connect to chemicals
(what's used), catalysts (what's produced), and samples (prepared materials).
The UserMethod association model tracks method modification history.

Schema Hierarchy:
- MethodBase: Common fields
- MethodCreate: For creating new methods
- MethodUpdate: For partial updates
- MethodSimple: Minimal for nested responses
- MethodResponse: Complete API response
- UserMethodCreate: For recording method changes
- UserMethodResponse: For displaying change history
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

from app.schemas.core.user import UserSimple
from app.schemas.catalysts.catalyst import CatalystSimple
from app.schemas.catalysts.sample import SampleSimple


class MethodBase(BaseModel):
    """
    Base schema for methods with common fields.
    """

    # Descriptive name for the method
    descriptive_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name identifying this synthesis method",
        examples=[
            "Sol-Gel Synthesis",
            "Wet Impregnation Method",
            "Hydrothermal Synthesis at 180°C"
        ]
    )

    # Detailed procedure
    procedure: str = Field(
        ...,
        min_length=1,
        description="Detailed step-by-step synthesis procedure",
        examples=[
            "1. Dissolve 10g of precursor in 100mL ethanol\n"
            "2. Add 2mL of catalyst dropwise while stirring\n"
            "3. Age solution for 24 hours at room temperature\n"
            "4. Dry at 80°C for 12 hours\n"
            "5. Calcine at 500°C for 4 hours"
        ]
    )


class MethodCreate(MethodBase):
    """
    Schema for creating a new method.
    
    Optionally accepts chemical IDs to establish initial associations.
    """

    chemical_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of chemicals used in this method"
    )


class MethodUpdate(BaseModel):
    """
    Schema for updating a method.
    
    All fields optional for partial updates.
    """

    descriptive_name: Optional[str] = Field(None, min_length=1, max_length=255)
    procedure: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None

    chemical_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace chemical associations"
    )


class MethodSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    descriptive_name: str = Field(..., description="Method name")
    is_active: bool = Field(..., description="Active status")

    model_config = ConfigDict(from_attributes=True)


class MethodResponse(MethodBase):
    """
    Complete schema for method data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    chemical_count: int = Field(
        default=0,
        description="Number of chemicals used"
    )

    catalyst_count: int = Field(
        default=0,
        description="Number of catalysts made with this method"
    )

    sample_count: int = Field(
        default=0,
        description="Number of samples prepared with this method"
    )

    is_in_use: bool = Field(
        default=False,
        description="Whether any catalysts or samples use this method"
    )

    modification_count: int = Field(
        default=0,
        description="Number of recorded modifications"
    )

    # Optional nested relationships
    chemicals: Optional[List["ChemicalSimple"]] = Field(
        default=None,
        description="Chemicals used (included when requested)"
    )

    catalysts: Optional[List["CatalystSimple"]] = Field(
        default=None,
        description="Catalysts made with this method (included when requested)"
    )

    samples: Optional[List["SampleSimple"]] = Field(
        default=None,
        description="Samples prepared with this method (included when requested)"
    )

    user_changes: Optional[List["UserMethodResponse"]] = Field(
        default=None,
        description="Modification history (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "descriptive_name": "Sol-gel TiO2 synthesis",
                    "procedure": "1. Dissolve TTIP in ethanol...\n"
                                 "2. Add HCl slowly with stirring...\n"
                                 "3. Age the gel for 24h...",
                    "is_active": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "chemical_count": 4,
                    "catalyst_count": 5,
                    "sample_count": 12,
                    "is_in_use": True,
                    "modification_count": 2
                }
            ]
        }
    )


# =============================================================================
# UserMethod Schemas (Method Modification History)
# =============================================================================

class UserMethodCreate(BaseModel):
    """
    Schema for recording a method modification.
    
    Used when updating a method to track who made changes and why.
    """

    user_id: int = Field(
        ...,
        gt=0,
        description="ID of user who made the change"
    )

    change_notes: Optional[str] = Field(
        None,
        description="Description of what was changed and why"
    )


class UserMethodResponse(BaseModel):
    """
    Schema for displaying method modification history.
    """

    id: int = Field(..., description="Modification record ID")
    user_id: int = Field(..., description="User who made the change")
    method_id: int = Field(..., description="Method that was changed")
    changed_at: datetime = Field(..., description="When the change was made")
    change_notes: Optional[str] = Field(None, description="Change description")

    # Optional: Include user details when requested
    user: Optional[UserSimple] = Field(
        default=None,
        description="User details (included when requested)"
    )

    model_config = ConfigDict(from_attributes=True)


# Import at the bottom to avoid circular dependencies
# This is a common pattern when schemas reference each other
from app.schemas.catalysts.chemical import ChemicalSimple

# Update forward reference
MethodResponse.model_rebuild()
