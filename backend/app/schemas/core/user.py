"""
Pydantic schemas for User entity.

Users represent research personnel who work with the system. The schemas
support user management operations and are used in audit tracking throughout
the application.

Note: Authentication fields (password, tokens) are intentionally excluded.
This system tracks users for audit purposes; authentication should be
handled by a separate service or identity provider.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "CatalystSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.catalysts.catalyst import CatalystSimple
    from app.schemas.catalysts.sample import SampleSimple
    from app.schemas.analysis.characterization import CharacterizationSimple
    from app.schemas.analysis.observation import ObservationSimple
    from app.schemas.experiments.experiment import ExperimentSimple


class UserBase(BaseModel):
    """
    Base schema for users containing core attributes.
    """

    # Login identifier
    username: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique username for identification",
        examples=["jsmith", "researcher1"]
    )

    # Display name
    full_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name for display",
        examples=["John Smith", "Jane Doe"]
    )

    # Contact email
    email: EmailStr = Field(
        ...,
        description="Email address (must be unique)",
        examples=["jsmith@lab.edu"]
    )


class UserCreate(UserBase):
    """
    Schema for creating a new user.
    
    Inherits all fields from UserBase. In a system with authentication,
    this would include password fields.
    """
    pass


class UserUpdate(BaseModel):
    """
    Schema for updating a user.
    
    All fields optional for partial updates.
    """

    username: Optional[str] = Field(None, min_length=1, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = Field(
        None,
        description="Whether user account is active"
    )


class UserSimple(BaseModel):
    """
    Simplified schema for nested representations.
    
    Used when users appear in audit tracking lists.
    """

    id: int = Field(..., description="Unique identifier")
    username: str = Field(..., description="Username")
    full_name: str = Field(..., description="Display name")

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """
    Complete schema for user data returned by the API.
    
    Includes all base fields plus metadata and optional statistics.
    """

    id: int = Field(..., description="Unique identifier")
    is_active: bool = Field(..., description="Whether account is active")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Optional statistics (populated via include parameter)
    catalyst_count: Optional[int] = Field(
        default=None,
        description="Number of catalysts worked on"
    )

    sample_count: Optional[int] = Field(
        default=None,
        description="Number of samples worked on"
    )

    characterization_count: Optional[int] = Field(
        default=None,
        description="Number of characterizations performed"
    )

    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments participated in"
    )

    # Optional relationships (populated via include parameter) - using string forward refs
    catalysts: Optional[List["CatalystSimple"]] = Field(
        default=None,
        description="Catalysts worked on (included when requested)"
    )

    samples: Optional[List["SampleSimple"]] = Field(
        default=None,
        description="Samples worked on (included when requested)"
    )

    characterizations: Optional[List["CharacterizationSimple"]] = Field(
        default=None,
        description="Characterizations performed (included when requested)"
    )

    observations: Optional[List["ObservationSimple"]] = Field(
        default=None,
        description="Observations made (included when requested)"
    )

    experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Experiments participated in (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "username": "jsmith",
                    "full_name": "John Smith",
                    "email": "jsmith@lab.edu",
                    "is_active": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "catalyst_count": 5,
                    "sample_count": 12,
                    "characterization_count": 23,
                    "experiment_count": 8
                }
            ]
        }
    )
