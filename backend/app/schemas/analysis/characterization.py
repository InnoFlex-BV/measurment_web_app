"""
Pydantic schemas for Characterization entity.

Characterizations represent analytical measurements performed on catalysts
and samples. Common techniques include XRD, BET, TEM, XPS, FTIR, etc.

The schemas support:
- Linking to catalysts and/or samples (many-to-many)
- Attaching raw and processed data files
- Recording technique-specific parameters in description
- Tracking who performed the characterization

Schema Design Philosophy:
------------------------
Rather than trying to capture all possible characterization parameters
in typed fields (which would require constant schema updates), we use:
1. type_name: Standardized technique abbreviation
2. description: Free-form text for technique-specific details
3. File references: For actual measurement data

This keeps the schema stable while accommodating any characterization type.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "CatalystSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.catalysts.catalyst import CatalystSimple
    from app.schemas.catalysts.sample import SampleSimple
    from app.schemas.core.file import FileSimple
    from app.schemas.core.user import UserSimple


class CharacterizationBase(BaseModel):
    """
    Base schema for characterizations.
    
    The type_name should be a standardized abbreviation for consistency.
    The description field captures technique-specific parameters.
    """

    # Characterization technique type
    type_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Characterization technique type",
        examples=["XRD", "BET", "TEM", "SEM", "XPS", "FTIR", "TPR", "ICP-OES"]
    )

    # Detailed description including parameters
    description: Optional[str] = Field(
        None,
        description="Technique parameters and conditions",
        examples=[
            "Cu Kα radiation, 2θ = 10-80°, 0.02°/step, 2s/step",
            "N2 adsorption at 77K, degassed at 200°C for 4h"
        ]
    )

    # File references (optional - files may be added later)
    processed_data_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of processed data file"
    )

    raw_data_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of raw data file"
    )


class CharacterizationCreate(CharacterizationBase):
    """
    Schema for creating a new characterization.
    
    Allows specifying which catalysts/samples were analyzed and
    which users performed the characterization.
    """

    # Associate with catalysts during creation
    catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of catalysts analyzed in this characterization"
    )

    # Associate with samples during creation
    sample_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of samples analyzed in this characterization"
    )

    # Record who performed the characterization
    user_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of users who performed this characterization"
    )


class CharacterizationUpdate(BaseModel):
    """
    Schema for updating a characterization.
    
    All fields optional for partial updates. Relationship IDs
    replace existing associations when provided.
    """

    type_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    processed_data_id: Optional[int] = Field(None, gt=0)
    raw_data_id: Optional[int] = Field(None, gt=0)

    # Relationship updates (replace existing)
    catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace catalyst associations"
    )

    sample_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace sample associations"
    )

    user_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace user associations"
    )


class CharacterizationSimple(BaseModel):
    """
    Simplified schema for nested representations.
    
    Used when characterizations appear in catalyst or sample responses.
    """

    id: int = Field(..., description="Unique identifier")
    type_name: str = Field(..., description="Technique type")
    description: Optional[str] = Field(None, description="Parameters/conditions")
    created_at: datetime = Field(..., description="When performed")

    model_config = ConfigDict(from_attributes=True)


class CharacterizationResponse(CharacterizationBase):
    """
    Complete schema for characterization data returned by the API.
    
    Includes all base fields plus metadata and optional nested
    relationships when requested.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    has_raw_data: bool = Field(
        default=False,
        description="Whether raw data file is attached"
    )

    has_processed_data: bool = Field(
        default=False,
        description="Whether processed data file is attached"
    )

    catalyst_count: int = Field(
        default=0,
        description="Number of catalysts analyzed"
    )

    sample_count: int = Field(
        default=0,
        description="Number of samples analyzed"
    )

    # Optional nested relationships - using string forward refs
    catalysts: Optional[List["CatalystSimple"]] = Field(
        default=None,
        description="Analyzed catalysts (included when requested)"
    )

    samples: Optional[List["SampleSimple"]] = Field(
        default=None,
        description="Analyzed samples (included when requested)"
    )

    processed_data_file: Optional["FileSimple"] = Field(
        default=None,
        description="Processed data file info (included when requested)"
    )

    raw_data_file: Optional["FileSimple"] = Field(
        default=None,
        description="Raw data file info (included when requested)"
    )

    users: Optional[List["UserSimple"]] = Field(
        default=None,
        description="Users who performed this (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "type_name": "XRD",
                    "description": "Cu Kα radiation, 2θ = 10-80°, room temperature",
                    "processed_data_id": 5,
                    "raw_data_id": 4,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "has_raw_data": True,
                    "has_processed_data": True,
                    "catalyst_count": 1,
                    "sample_count": 0
                }
            ]
        }
    )
