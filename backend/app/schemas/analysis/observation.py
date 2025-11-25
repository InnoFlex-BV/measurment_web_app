"""
Pydantic schemas for Observation entity.

Observations capture qualitative research notes with a combination of
structured JSON data and free-form text. The JSONB fields provide
flexibility for different observation types while maintaining some
structure for querying and analysis.

JSONB Field Guidelines:
----------------------
1. conditions: Environmental/process conditions during observation
   - Keys should be lowercase with underscores
   - Include units where applicable (e.g., "temperature_unit": "°C")
   - Common keys: temperature, pressure, atmosphere, duration, stirring_rate

2. calcination_parameters: Heat treatment settings
   - ramp_rate, target_temperature, hold_time
   - atmosphere, cooling method
   - Set to empty dict {} if not applicable

3. data: Collected measurements and observations
   - Any numerical or categorical data
   - Before/after comparisons
   - Yield estimates, color changes, etc.

These schemas ensure the JSON fields are properly validated while
maintaining flexibility for diverse research needs.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any


class ObservationBase(BaseModel):
    """
    Base schema for observations.
    
    Combines structured JSON fields with free-form text to capture
    the full context of research observations.
    """

    # Objective of this observation
    objective: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="What was the purpose of this observation?",
        examples=[
            "Monitor color change during synthesis",
            "Document calcination behavior",
            "Record unexpected precipitation"
        ]
    )

    # Conditions during observation (JSONB)
    conditions: Dict[str, Any] = Field(
        default_factory=dict,
        description="Environmental/process conditions",
        examples=[
            {
                "temperature": 80,
                "temperature_unit": "°C",
                "atmosphere": "N2",
                "duration": 2,
                "duration_unit": "hours"
            }
        ]
    )

    # Calcination parameters (JSONB)
    calcination_parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Heat treatment parameters (empty if N/A)",
        examples=[
            {
                "ramp_rate": 5,
                "ramp_unit": "°C/min",
                "target_temperature": 500,
                "hold_time": 4,
                "hold_unit": "hours",
                "atmosphere": "air"
            }
        ]
    )

    # Free-form observation text
    observations_text: str = Field(
        ...,
        min_length=1,
        description="Detailed description of what was observed",
        examples=["Solution turned from clear to pale yellow after 30 minutes. "
                  "Small bubbles observed indicating gas evolution."]
    )

    # Structured data collected (JSONB)
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Numerical measurements and categorical data",
        examples=[
            {
                "mass_before": 2.5,
                "mass_after": 2.1,
                "mass_loss_percent": 16,
                "color_before": "white",
                "color_after": "pale yellow"
            }
        ]
    )

    # Conclusions
    conclusions: str = Field(
        ...,
        min_length=1,
        description="What was learned from this observation?",
        examples=["The calcination successfully removed organic precursors. "
                  "16% mass loss consistent with expected decomposition."]
    )

    @field_validator('conditions', 'calcination_parameters', 'data', mode='before')
    @classmethod
    def ensure_dict(cls, v):
        """Ensure JSON fields are dictionaries."""
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError('Must be a dictionary')
        return v


class ObservationCreate(ObservationBase):
    """
    Schema for creating a new observation.
    
    Allows linking to catalysts, samples, files, and users
    during creation.
    """

    # Associate with catalysts
    catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of catalysts this observation relates to"
    )

    # Associate with samples
    sample_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of samples this observation relates to"
    )

    # Attach files (images, documents, data)
    file_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of files to attach to this observation"
    )

    # Record who made the observation
    user_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of users who made this observation"
    )


class ObservationUpdate(BaseModel):
    """
    Schema for updating an observation.
    
    All fields optional for partial updates.
    """

    objective: Optional[str] = Field(None, min_length=1, max_length=255)
    conditions: Optional[Dict[str, Any]] = None
    calcination_parameters: Optional[Dict[str, Any]] = None
    observations_text: Optional[str] = Field(None, min_length=1)
    data: Optional[Dict[str, Any]] = None
    conclusions: Optional[str] = Field(None, min_length=1)

    # Relationship updates
    catalyst_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace catalyst associations"
    )

    sample_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace sample associations"
    )

    file_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace file associations"
    )

    user_ids: Optional[List[int]] = Field(
        default=None,
        description="Replace user associations"
    )

    @field_validator('conditions', 'calcination_parameters', 'data', mode='before')
    @classmethod
    def ensure_dict_if_provided(cls, v):
        """Ensure JSON fields are dictionaries when provided."""
        if v is None:
            return None
        if not isinstance(v, dict):
            raise ValueError('Must be a dictionary')
        return v


class ObservationSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    objective: str = Field(..., description="Observation objective")
    created_at: datetime = Field(..., description="When recorded")

    model_config = ConfigDict(from_attributes=True)


class ObservationResponse(ObservationBase):
    """
    Complete schema for observation data returned by the API.
    
    Includes all fields plus metadata and optional relationships.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    has_calcination_data: bool = Field(
        default=False,
        description="Whether calcination parameters were recorded"
    )

    catalyst_count: int = Field(
        default=0,
        description="Number of related catalysts"
    )

    sample_count: int = Field(
        default=0,
        description="Number of related samples"
    )

    file_count: int = Field(
        default=0,
        description="Number of attached files"
    )

    # Optional nested relationships
    catalysts: Optional[List[Any]] = Field(
        default=None,
        description="Related catalysts (included when requested)"
    )

    samples: Optional[List[Any]] = Field(
        default=None,
        description="Related samples (included when requested)"
    )

    files: Optional[List[Any]] = Field(
        default=None,
        description="Attached files (included when requested)"
    )

    users: Optional[List[Any]] = Field(
        default=None,
        description="Users who made this observation (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "objective": "Document TiO2 calcination",
                    "conditions": {
                        "initial_material": "TiO2 gel",
                        "atmosphere": "air"
                    },
                    "calcination_parameters": {
                        "ramp_rate": 5,
                        "target_temperature": 500,
                        "hold_time": 4,
                        "atmosphere": "air"
                    },
                    "observations_text": "White gel transformed to white powder. "
                                         "No discoloration observed.",
                    "data": {
                        "mass_before": 3.2,
                        "mass_after": 2.1,
                        "mass_loss_percent": 34.4,
                        "color": "white"
                    },
                    "conclusions": "Successful calcination with expected mass loss "
                                   "from precursor decomposition.",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "has_calcination_data": True,
                    "catalyst_count": 1,
                    "sample_count": 0,
                    "file_count": 2
                }
            ]
        }
    )