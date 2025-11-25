"""
Pydantic schemas for Method entity.

Methods represent synthesis procedures for creating catalysts. They connect
to chemicals through a many-to-many relationship, which creates interesting
questions about how to represent that relationship in the API.

We'll use a pragmatic approach where:
- Creation accepts a list of chemical IDs (chemicals must already exist)
- Responses can optionally include full chemical objects when requested
- Updates can modify the chemical list by providing a new list of IDs
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class MethodBase(BaseModel):
    """
    Base schema for methods containing core attributes.
    
    These are the fields that describe a method regardless of whether
    you're creating it, updating it, or viewing it.
    """

    # Descriptive name should be meaningful and distinguish this method
    # from others. It doesn't need to be globally unique (no constraint)
    # because methods might have similar names with subtle variations
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

    # Procedure contains the detailed step-by-step instructions
    # This is the actual recipe that researchers follow to create catalysts
    # No max_length because procedures can be arbitrarily long
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
    
    When creating a method, you specify which chemicals it uses by providing
    a list of chemical IDs. This assumes the chemicals already exist in the
    database. If a chemical doesn't exist yet, you'd create it first, then
    create the method referencing it.
    
    This approach (providing IDs) is simpler than accepting nested chemical
    objects because it avoids questions about whether to create chemicals
    inline or error if they don't exist. It makes the API more predictable.
    """

    # List of chemical IDs that this method uses
    # Each ID must reference an existing chemical in the database
    # The router will validate these IDs exist before creating the method
    chemical_ids: List[int] = Field(
        default=[],
        description="IDs of chemicals used in this method",
        examples=[[1, 3, 7], [2, 5]]
    )

    # is_active defaults to True but can be set at creation
    # This allows pre-creating methods that aren't immediately available
    is_active: Optional[bool] = Field(
        default=True,
        description="Whether this method is available for use"
    )


class MethodUpdate(BaseModel):
    """
    Schema for updating a method.
    
    All fields are optional for partial updates. Updating the chemical_ids
    list replaces the entire list, not a partial update of the list.
    If you want to add one chemical, you provide the complete new list
    including existing chemicals plus the new one.
    """

    descriptive_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated method name"
    )

    procedure: Optional[str] = Field(
        None,
        min_length=1,
        description="Updated procedure text"
    )

    # When updating chemical_ids, provide the complete new list
    # To add a chemical: include all existing IDs plus the new one
    # To remove a chemical: include all IDs except the one to remove
    # This approach is simpler than trying to handle partial list updates
    chemical_ids: Optional[List[int]] = Field(
        None,
        description="Updated list of chemical IDs"
    )

    is_active: Optional[bool] = Field(
        None,
        description="Whether to activate or deactivate this method"
    )

class MethodSimple(MethodBase):
    """
    Simplified schema for nested representations.
    """
    id: int = Field(..., description="Unique identifier")
    is_active: bool = Field(..., description="Whether this method is available")
    created_at: datetime = Field(..., description="When this method was created")
    updated_at: datetime = Field(..., description="When this method was last modified")

    model_config = ConfigDict(from_attributes=True)

class MethodResponse(MethodBase):
    """
    Schema for method data returned by the API.
    
    This is where things get interesting with relationships. We can include
    just the IDs of related chemicals, or we can include full chemical objects.
    The approach I'm showing here includes an optional chemicals list that
    can be populated when the client requests detailed information.
    """

    id: int = Field(..., description="Unique identifier")
    is_active: bool = Field(..., description="Whether this method is available")
    created_at: datetime = Field(..., description="When this method was created")
    updated_at: datetime = Field(..., description="When this method was last modified")

    # Optional nested list of chemicals
    # When populated, this contains full Chemical objects
    # When None, clients only see the method attributes without relationships
    # The router decides whether to populate this based on query parameters
    #
    # Note the List[...] type annotation requires importing the ChemicalResponse
    # schema, but we can't import it at the top because that would create
    # a circular import (chemicals imports methods, methods imports chemicals)
    # We solve this by using a forward reference string "ChemicalResponse"
    # and calling model_rebuild() after all schemas are loaded
    chemicals: Optional[List["ChemicalSimple"]] = Field(
        default=None,
        description="List of chemicals used in this method (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "descriptive_name": "Sol-Gel Synthesis",
                    "procedure": "1. Mix precursors...\n2. Age solution...\n3. Calcine...",
                    "is_active": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "chemicals": None  # Or could include full chemical objects
                }
            ]
        }
    )


# Import at the bottom to avoid circular dependencies
# This is a common pattern when schemas reference each other
from app.schemas.catalysts.chemical import ChemicalSimple

# Tell Pydantic to rebuild the model now that ChemicalResponse is available
# This resolves the forward reference "ChemicalResponse" in the chemicals field
MethodResponse.model_rebuild()