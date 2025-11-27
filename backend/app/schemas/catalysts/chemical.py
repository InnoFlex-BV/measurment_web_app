"""
Pydantic schemas for Chemical entity.

Chemicals represent reagents and compounds used in synthesis methods.
The database schema is intentionally simple - only tracking the chemical
name. Additional metadata like CAS numbers or formulas could be added
via database migration if needed.

Database Schema:
---------------
create table chemicals (
    id serial primary key,
    name varchar(50) not null unique,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Any


class ChemicalBase(BaseModel):
    """
    Base schema for chemicals.
    
    Only contains the name field since that's all the database stores.
    Name is limited to 50 characters per database schema.
    """

    # Chemical name - required and unique
    name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Chemical name (must be unique, max 50 chars)",
        examples=["Chloroplatinic Acid", "TEOS", "NaOH"]
    )


class ChemicalCreate(ChemicalBase):
    """
    Schema for creating a new chemical.
    
    Inherits name from ChemicalBase. No additional fields needed.
    """
    pass


class ChemicalUpdate(BaseModel):
    """
    Schema for updating a chemical.
    
    In practice, chemicals are rarely updated after creation because changing
    a chemical's name would affect all methods that reference it.
    """

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Updated chemical name"
    )


class ChemicalSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Chemical name")

    model_config = ConfigDict(from_attributes=True)


class ChemicalResponse(ChemicalBase):
    """
    Complete schema for chemical data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties from model
    method_count: int = Field(
        default=0,
        description="Number of methods using this chemical"
    )

    is_in_use: bool = Field(
        default=False,
        description="Whether any methods reference this chemical"
    )

    # Optional nested relationships
    methods: Optional[List["MethodSimple"]] = Field(
        default=None,
        description="Methods using this chemical (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Chloroplatinic Acid",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "method_count": 3,
                    "is_in_use": True
                }
            ]
        }
    )
# Import at the bottom to avoid circular dependencies
# This is a common pattern when schemas reference each other
from app.schemas.catalysts.method import MethodSimple

# Tell Pydantic to rebuild the model now that ChemicalResponse is available
# This resolves the forward reference "ChemicalResponse" in the chemicals field
ChemicalResponse.model_rebuild()
