"""
Pydantic schemas for Group entity.

Groups allow organizing experiments into logical collections for
comparison and analysis. A group might represent a parameter study,
a catalyst comparison, or experiments for a specific publication.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Any


class GroupBase(BaseModel):
    """
    Base schema for groups.
    """

    # Group name
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Group name",
        examples=["Temperature Study TiO2-Pt", "Catalyst Comparison 2024-Q1"]
    )

    # Purpose
    purpose: Optional[str] = Field(
        None,
        max_length=255,
        description="Purpose of this grouping",
        examples=["Compare catalyst performance at different temperatures"]
    )

    # Document reference
    discussed_in_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of document file discussing this group"
    )

    # Conclusion
    conclusion: Optional[str] = Field(
        None,
        description="Summary of findings from this group"
    )

    # Method
    method: Optional[str] = Field(
        None,
        description="Experimental methodology for this group"
    )


class GroupCreate(GroupBase):
    """
    Schema for creating a new group.
    """

    # Optional: experiments to add on creation
    experiment_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of experiments to add to this group"
    )


class GroupUpdate(BaseModel):
    """
    Schema for updating a group.
    
    All fields optional for partial updates.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(None, max_length=255)
    discussed_in_id: Optional[int] = Field(None, gt=0)
    conclusion: Optional[str] = None
    method: Optional[str] = None

    # Relationship updates
    experiment_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace experiment associations"
    )


class GroupSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Group name")
    purpose: Optional[str] = Field(None, description="Purpose")

    model_config = ConfigDict(from_attributes=True)


class GroupResponse(GroupBase):
    """
    Complete schema for group data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments in this group"
    )

    has_document: Optional[bool] = Field(
        default=None,
        description="Whether a document is linked"
    )

    has_conclusion: Optional[bool] = Field(
        default=None,
        description="Whether conclusion is recorded"
    )

    # Optional relationships
    discussed_in_file: Optional[Any] = Field(
        default=None,
        description="Document file (included when requested)"
    )

    experiments: Optional[List[Any]] = Field(
        default=None,
        description="Experiments in this group (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Temperature Study TiO2-Pt",
                    "purpose": "Investigate temperature dependence of plasma catalysis",
                    "discussed_in_id": 5,
                    "conclusion": "Optimal temperature range is 200-300°C",
                    "method": "DBD plasma at 50W with varying reactor temperature",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 8,
                    "has_document": True,
                    "has_conclusion": True
                }
            ]
        }
    )