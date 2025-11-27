"""
Pydantic schemas for Experiment entities (base + subtypes).

Experiments are the core data collection entities, recording conditions
and results of catalytic testing. This module implements schemas for:
- Experiment: Base with common fields
- Plasma: Plasma-catalysis experiments
- Photocatalysis: Light-driven catalytic reactions
- Misc: Other experiment types

The experiment_type field acts as a discriminator for polymorphic handling.
"""

from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, Dict, Literal, Union


# =============================================================================
# Base Experiment Schemas
# =============================================================================

class ExperimentBase(BaseModel):
    """
    Base schema for experiments with common fields.
    """

    # Experiment name/identifier
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Experiment name/identifier",
        examples=["TiO2-Pt_500ppm-toluene_50W_2024-01-15"]
    )

    # Purpose/objective
    purpose: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Purpose/objective of this experiment",
        examples=["Test catalyst performance at elevated temperature"]
    )

    # Equipment references
    reactor_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of reactor used"
    )

    analyzer_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of analyzer used"
    )

    # File references
    raw_data_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of raw data file"
    )

    figures_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of figures file"
    )

    discussed_in_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of publication/report file"
    )

    # Processed data
    processed_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Flexible JSONB storage for processed data"
    )

    processed_table_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of structured processed results"
    )

    # Text fields
    conclusion: Optional[str] = Field(
        None,
        description="Conclusion from this experiment"
    )

    notes: Optional[str] = Field(
        None,
        description="Additional notes"
    )


class ExperimentCreate(ExperimentBase):
    """
    Schema for creating a new experiment.
    
    Note: Use PlasmaCreate, PhotocatalysisCreate, or MiscCreate for specific types.
    """

    experiment_type: Literal['plasma', 'photocatalysis', 'misc'] = Field(
        ...,
        description="Type of experiment"
    )

    # Relationship IDs for creation
    sample_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of samples to associate"
    )

    contaminant_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of contaminants (use contaminant_data for ppm values)"
    )

    carrier_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of carriers (use carrier_data for ratio values)"
    )

    group_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of groups to add this experiment to"
    )

    user_ids: Optional[List[int]] = Field(
        default=None,
        description="IDs of users who performed this experiment"
    )

    # For junction tables with extra data
    contaminant_data: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Contaminants with ppm: [{'id': 1, 'ppm': 500.0}, ...]"
    )

    carrier_data: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Carriers with ratio: [{'id': 1, 'ratio': 0.8}, ...]"
    )


class ExperimentUpdate(BaseModel):
    """
    Schema for updating an experiment.
    
    All fields optional for partial updates.
    Note: experiment_type cannot be changed.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(None, min_length=1, max_length=255)
    reactor_id: Optional[int] = Field(None, gt=0)
    analyzer_id: Optional[int] = Field(None, gt=0)
    raw_data_id: Optional[int] = Field(None, gt=0)
    figures_id: Optional[int] = Field(None, gt=0)
    discussed_in_id: Optional[int] = Field(None, gt=0)
    processed_data: Optional[Dict[str, Any]] = None
    processed_table_id: Optional[int] = Field(None, gt=0)
    conclusion: Optional[str] = None
    notes: Optional[str] = None

    # Relationship updates
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class ExperimentSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Experiment name")
    experiment_type: str = Field(..., description="Experiment type")
    purpose: str = Field(..., description="Purpose")

    model_config = ConfigDict(from_attributes=True)


class ExperimentResponse(ExperimentBase):
    """
    Complete schema for experiment data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_type: str = Field(..., description="Type discriminator")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    sample_count: Optional[int] = Field(
        default=None,
        description="Number of samples tested"
    )

    has_raw_data: Optional[bool] = Field(
        default=None,
        description="Whether raw data is attached"
    )

    has_processed_data: Optional[bool] = Field(
        default=None,
        description="Whether processed data exists"
    )

    has_conclusion: Optional[bool] = Field(
        default=None,
        description="Whether conclusion is recorded"
    )

    # Optional relationships
    reactor: Optional[Any] = Field(
        default=None,
        description="Reactor used (included when requested)"
    )

    analyzer: Optional[Any] = Field(
        default=None,
        description="Analyzer used (included when requested)"
    )

    samples: Optional[List[Any]] = Field(
        default=None,
        description="Samples tested (included when requested)"
    )

    contaminants: Optional[List[Any]] = Field(
        default=None,
        description="Target contaminants (included when requested)"
    )

    carriers: Optional[List[Any]] = Field(
        default=None,
        description="Carrier gases (included when requested)"
    )

    groups: Optional[List[Any]] = Field(
        default=None,
        description="Groups containing this experiment (included when requested)"
    )

    users: Optional[List[Any]] = Field(
        default=None,
        description="Users who performed (included when requested)"
    )

    raw_data_file: Optional[Any] = Field(
        default=None,
        description="Raw data file (included when requested)"
    )

    processed_results: Optional[Any] = Field(
        default=None,
        description="Structured processed results (included when requested)"
    )

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Plasma Experiment Schemas
# =============================================================================

class PlasmaBase(ExperimentBase):
    """
    Base schema for plasma experiments with plasma-specific fields.
    """

    # Waveform reference
    driving_waveform_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of driving waveform configuration"
    )

    # Power parameters
    delivered_power: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Power delivered to plasma (W)",
        examples=["50.0", "100.5"]
    )

    # Timing parameters (for pulsed operation)
    on_time: Optional[int] = Field(
        None,
        ge=0,
        description="Plasma on duration (ms or s)"
    )

    off_time: Optional[int] = Field(
        None,
        ge=0,
        description="Plasma off duration (ms or s)"
    )

    # DC parameters
    dc_voltage: Optional[int] = Field(
        None,
        description="DC voltage component (V)"
    )

    dc_current: Optional[int] = Field(
        None,
        description="DC current component (mA)"
    )

    # Measured waveform file
    measured_waveform_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID of measured waveform file"
    )

    # Physical parameters
    electrode: Optional[str] = Field(
        None,
        description="Electrode configuration/material",
        examples=["Stainless steel mesh, 100 mesh"]
    )

    reactor_external_temperature: Optional[int] = Field(
        None,
        description="External reactor temperature (°C)"
    )


class PlasmaCreate(PlasmaBase):
    """
    Schema for creating a new plasma experiment.
    """

    experiment_type: Literal['plasma'] = Field(
        default='plasma',
        description="Type discriminator (always 'plasma')"
    )

    # Relationship IDs
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class PlasmaUpdate(BaseModel):
    """
    Schema for updating a plasma experiment.
    """

    # Base experiment fields
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(None, min_length=1, max_length=255)
    reactor_id: Optional[int] = Field(None, gt=0)
    analyzer_id: Optional[int] = Field(None, gt=0)
    raw_data_id: Optional[int] = Field(None, gt=0)
    figures_id: Optional[int] = Field(None, gt=0)
    discussed_in_id: Optional[int] = Field(None, gt=0)
    processed_data: Optional[Dict[str, Any]] = None
    processed_table_id: Optional[int] = Field(None, gt=0)
    conclusion: Optional[str] = None
    notes: Optional[str] = None

    # Plasma-specific fields
    driving_waveform_id: Optional[int] = Field(None, gt=0)
    delivered_power: Optional[Decimal] = Field(None, ge=0)
    on_time: Optional[int] = Field(None, ge=0)
    off_time: Optional[int] = Field(None, ge=0)
    dc_voltage: Optional[int] = None
    dc_current: Optional[int] = None
    measured_waveform_id: Optional[int] = Field(None, gt=0)
    electrode: Optional[str] = None
    reactor_external_temperature: Optional[int] = None

    # Relationship updates
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class PlasmaResponse(PlasmaBase):
    """
    Complete schema for plasma experiment data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_type: Literal['plasma'] = Field(default='plasma')
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    is_pulsed: Optional[bool] = Field(
        default=None,
        description="Whether this is pulsed operation"
    )

    duty_cycle: Optional[float] = Field(
        default=None,
        description="Duty cycle for pulsed operation (%)"
    )

    sample_count: Optional[int] = Field(default=None)
    has_raw_data: Optional[bool] = Field(default=None)
    has_processed_data: Optional[bool] = Field(default=None)
    has_conclusion: Optional[bool] = Field(default=None)

    # Optional relationships (from base)
    reactor: Optional[Any] = Field(default=None)
    analyzer: Optional[Any] = Field(default=None)
    samples: Optional[List[Any]] = Field(default=None)
    contaminants: Optional[List[Any]] = Field(default=None)
    carriers: Optional[List[Any]] = Field(default=None)
    groups: Optional[List[Any]] = Field(default=None)
    users: Optional[List[Any]] = Field(default=None)
    raw_data_file: Optional[Any] = Field(default=None)
    processed_results: Optional[Any] = Field(default=None)

    # Plasma-specific relationships
    driving_waveform: Optional[Any] = Field(
        default=None,
        description="Driving waveform configuration (included when requested)"
    )

    measured_waveform_file: Optional[Any] = Field(
        default=None,
        description="Measured waveform file (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Plasma_TiO2_500ppm_50W",
                    "experiment_type": "plasma",
                    "purpose": "Test DBD plasma catalysis performance",
                    "reactor_id": 1,
                    "analyzer_id": 1,
                    "driving_waveform_id": 1,
                    "delivered_power": "50.0000",
                    "on_time": None,
                    "off_time": None,
                    "electrode": "Stainless steel mesh",
                    "reactor_external_temperature": 25,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "is_pulsed": False,
                    "duty_cycle": 100.0
                }
            ]
        }
    )


# =============================================================================
# Photocatalysis Experiment Schemas
# =============================================================================

class PhotocatalysisBase(ExperimentBase):
    """
    Base schema for photocatalysis experiments with light-specific fields.
    """

    # Light parameters
    wavelength: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Peak wavelength of light source (nm)",
        examples=["365", "254", "450"]
    )

    power: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Light power or intensity (W or mW/cm²)",
        examples=["100", "50.5"]
    )


class PhotocatalysisCreate(PhotocatalysisBase):
    """
    Schema for creating a new photocatalysis experiment.
    """

    experiment_type: Literal['photocatalysis'] = Field(
        default='photocatalysis',
        description="Type discriminator (always 'photocatalysis')"
    )

    # Relationship IDs
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class PhotocatalysisUpdate(BaseModel):
    """
    Schema for updating a photocatalysis experiment.
    """

    # Base experiment fields
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(None, min_length=1, max_length=255)
    reactor_id: Optional[int] = Field(None, gt=0)
    analyzer_id: Optional[int] = Field(None, gt=0)
    raw_data_id: Optional[int] = Field(None, gt=0)
    figures_id: Optional[int] = Field(None, gt=0)
    discussed_in_id: Optional[int] = Field(None, gt=0)
    processed_data: Optional[Dict[str, Any]] = None
    processed_table_id: Optional[int] = Field(None, gt=0)
    conclusion: Optional[str] = None
    notes: Optional[str] = None

    # Photocatalysis-specific fields
    wavelength: Optional[Decimal] = Field(None, ge=0)
    power: Optional[Decimal] = Field(None, ge=0)

    # Relationship updates
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class PhotocatalysisResponse(PhotocatalysisBase):
    """
    Complete schema for photocatalysis experiment data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_type: Literal['photocatalysis'] = Field(default='photocatalysis')
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    is_uv: Optional[bool] = Field(
        default=None,
        description="Whether using UV light (< 400 nm)"
    )

    is_visible: Optional[bool] = Field(
        default=None,
        description="Whether using visible light (400-700 nm)"
    )

    sample_count: Optional[int] = Field(default=None)
    has_raw_data: Optional[bool] = Field(default=None)
    has_processed_data: Optional[bool] = Field(default=None)
    has_conclusion: Optional[bool] = Field(default=None)

    # Optional relationships (from base)
    reactor: Optional[Any] = Field(default=None)
    analyzer: Optional[Any] = Field(default=None)
    samples: Optional[List[Any]] = Field(default=None)
    contaminants: Optional[List[Any]] = Field(default=None)
    carriers: Optional[List[Any]] = Field(default=None)
    groups: Optional[List[Any]] = Field(default=None)
    users: Optional[List[Any]] = Field(default=None)
    raw_data_file: Optional[Any] = Field(default=None)
    processed_results: Optional[Any] = Field(default=None)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 2,
                    "name": "Photo_TiO2_UV365_100W",
                    "experiment_type": "photocatalysis",
                    "purpose": "Test UV photocatalysis with P25 TiO2",
                    "reactor_id": 2,
                    "analyzer_id": 1,
                    "wavelength": "365.0000",
                    "power": "100.0000",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "is_uv": True,
                    "is_visible": False
                }
            ]
        }
    )


# =============================================================================
# Misc Experiment Schemas
# =============================================================================

class MiscBase(ExperimentBase):
    """
    Base schema for miscellaneous experiments.
    """

    # Misc-specific description
    description: Optional[str] = Field(
        None,
        description="Detailed description of this experiment type"
    )


class MiscCreate(MiscBase):
    """
    Schema for creating a new misc experiment.
    """

    experiment_type: Literal['misc'] = Field(
        default='misc',
        description="Type discriminator (always 'misc')"
    )

    # Relationship IDs
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class MiscUpdate(BaseModel):
    """
    Schema for updating a misc experiment.
    """

    # Base experiment fields
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(None, min_length=1, max_length=255)
    reactor_id: Optional[int] = Field(None, gt=0)
    analyzer_id: Optional[int] = Field(None, gt=0)
    raw_data_id: Optional[int] = Field(None, gt=0)
    figures_id: Optional[int] = Field(None, gt=0)
    discussed_in_id: Optional[int] = Field(None, gt=0)
    processed_data: Optional[Dict[str, Any]] = None
    processed_table_id: Optional[int] = Field(None, gt=0)
    conclusion: Optional[str] = None
    notes: Optional[str] = None

    # Misc-specific field
    description: Optional[str] = None

    # Relationship updates
    sample_ids: Optional[List[int]] = None
    contaminant_data: Optional[List[Dict[str, Any]]] = None
    carrier_data: Optional[List[Dict[str, Any]]] = None
    group_ids: Optional[List[int]] = None
    user_ids: Optional[List[int]] = None


class MiscResponse(MiscBase):
    """
    Complete schema for misc experiment data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_type: Literal['misc'] = Field(default='misc')
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    sample_count: Optional[int] = Field(default=None)
    has_raw_data: Optional[bool] = Field(default=None)
    has_processed_data: Optional[bool] = Field(default=None)
    has_conclusion: Optional[bool] = Field(default=None)

    # Optional relationships (from base)
    reactor: Optional[Any] = Field(default=None)
    analyzer: Optional[Any] = Field(default=None)
    samples: Optional[List[Any]] = Field(default=None)
    contaminants: Optional[List[Any]] = Field(default=None)
    carriers: Optional[List[Any]] = Field(default=None)
    groups: Optional[List[Any]] = Field(default=None)
    users: Optional[List[Any]] = Field(default=None)
    raw_data_file: Optional[Any] = Field(default=None)
    processed_results: Optional[Any] = Field(default=None)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 3,
                    "name": "Thermal_Control_500C",
                    "experiment_type": "misc",
                    "purpose": "Thermal catalysis control experiment",
                    "description": "Control experiment without plasma or light activation",
                    "reactor_id": 1,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                }
            ]
        }
    )


# =============================================================================
# Union Types for Polymorphic Handling
# =============================================================================

# For creating experiments
ExperimentCreateUnion = Union[PlasmaCreate, PhotocatalysisCreate, MiscCreate]

# For responses
ExperimentResponseUnion = Union[PlasmaResponse, PhotocatalysisResponse, MiscResponse]