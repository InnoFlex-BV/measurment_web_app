"""
Pydantic schemas for Waveform entity.

Waveforms define the electrical signal parameters used in plasma experiments,
capturing both AC and pulsing characteristics that control plasma discharge
behavior.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "ExperimentSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.experiments.experiment import ExperimentSimple


class WaveformBase(BaseModel):
    """
    Base schema for waveforms with core configuration fields.
    """

    # Waveform name/identifier
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Waveform configuration name",
        examples=["10kHz Sinusoidal", "Pulsed DBD 1kHz"]
    )

    # AC parameters
    ac_frequency: Optional[Decimal] = Field(
        None,
        ge=0,
        description="AC frequency (Hz or kHz)",
        examples=["10000", "50000"]
    )

    ac_duty_cycle: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="AC duty cycle percentage (0-100)",
        examples=["50", "80"]
    )

    # Pulsing parameters
    pulsing_frequency: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Pulsing/modulation frequency",
        examples=["1000", "500"]
    )

    pulsing_duty_cycle: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Pulsing duty cycle percentage (0-100)",
        examples=["50", "25"]
    )


class WaveformCreate(WaveformBase):
    """
    Schema for creating a new waveform configuration.
    """
    pass


class WaveformUpdate(BaseModel):
    """
    Schema for updating a waveform.
    
    All fields optional for partial updates.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    ac_frequency: Optional[Decimal] = Field(None, ge=0)
    ac_duty_cycle: Optional[Decimal] = Field(None, ge=0, le=100)
    pulsing_frequency: Optional[Decimal] = Field(None, ge=0)
    pulsing_duty_cycle: Optional[Decimal] = Field(None, ge=0, le=100)


class WaveformSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Waveform name")
    ac_frequency: Optional[Decimal] = Field(None, description="AC frequency")
    pulsing_frequency: Optional[Decimal] = Field(None, description="Pulsing frequency")

    model_config = ConfigDict(from_attributes=True)


class WaveformResponse(WaveformBase):
    """
    Complete schema for waveform data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    is_pulsed: Optional[bool] = Field(
        default=None,
        description="Whether this is a pulsed waveform"
    )

    has_ac: Optional[bool] = Field(
        default=None,
        description="Whether waveform has AC component"
    )

    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments using this waveform"
    )

    # Optional relationships - using string forward refs
    plasma_experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Plasma experiments using this waveform (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "10kHz Sinusoidal AC",
                    "ac_frequency": "10000",
                    "ac_duty_cycle": "50",
                    "pulsing_frequency": None,
                    "pulsing_duty_cycle": None,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "is_pulsed": False,
                    "has_ac": True,
                    "experiment_count": 5
                }
            ]
        }
    )
