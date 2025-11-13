"""
Pydantic schemas for Support entity.

Supports are substrate materials that catalysts can be applied to.
The schemas are straightforward because supports have minimal attributes.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class SupportBase(BaseModel):
    """
    Base schema for supports containing core attributes.
    """

    # Descriptive name uniquely identifies the support material
    # Should include material type and relevant specifications
    descriptive_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name identifying this support material",
        examples=[
            "γ-Alumina (200 m²/g)",
            "MCM-41 Mesoporous Silica",
            "TiO₂ Anatase P25"
        ]
    )

    # Optional detailed description
    # Can include properties, specifications, supplier information, etc.
    description: Optional[str] = Field(
        None,
        description="Detailed information about this support material"
    )


class SupportCreate(SupportBase):
    """
    Schema for creating a new support.
    
    No additional fields needed beyond those in SupportBase.
    """
    pass


class SupportUpdate(BaseModel):
    """
    Schema for updating a support.
    """

    descriptive_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated support name"
    )

    description: Optional[str] = Field(
        None,
        description="Updated description"
    )


class SupportResponse(SupportBase):
    """
    Schema for support data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="When this support was added")
    updated_at: datetime = Field(..., description="When this record was last modified")

    # We'll add a samples relationship in Phase 2 when we create the Sample schema

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "descriptive_name": "γ-Alumina (200 m²/g)",
                    "description": "High surface area alumina powder",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                }
            ]
        }
    )