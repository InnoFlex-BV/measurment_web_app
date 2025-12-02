"""
Pydantic schemas for Analyzer entities (base + FTIR + OES).

Analyzers are instruments used to measure experimental outputs.
This module implements schemas for the polymorphic analyzer hierarchy:
- Analyzer: Base with common fields
- FTIR: Fourier Transform Infrared spectrometer
- OES: Optical Emission Spectrometer

The analyzer_type field acts as a discriminator for polymorphic handling.

Note on imports:
----------------
To avoid circular imports while maintaining proper type serialization,
we use string forward references (e.g., "ExperimentSimple") for nested types.
These are resolved at runtime via model_rebuild() calls.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.experiments.experiment import ExperimentSimple


# =============================================================================
# Base Analyzer Schemas
# =============================================================================

class AnalyzerBase(BaseModel):
    """
    Base schema for analyzers with common fields.
    """

    # Analyzer name
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Analyzer name/identifier",
        examples=["Nicolet iS50 FTIR", "Ocean Optics USB4000"]
    )

    # Description
    description: Optional[str] = Field(
        None,
        description="Detailed description and configuration notes"
    )


class AnalyzerCreate(AnalyzerBase):
    """
    Schema for creating a new base analyzer.
    
    Note: Use FTIRCreate or OESCreate for specific types.
    """

    analyzer_type: Literal['ftir', 'oes'] = Field(
        ...,
        description="Type of analyzer"
    )


class AnalyzerUpdate(BaseModel):
    """
    Schema for updating an analyzer.
    
    All fields optional for partial updates.
    Note: analyzer_type cannot be changed.
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class AnalyzerSimple(BaseModel):
    """
    Simplified schema for nested representations.
    """

    id: int = Field(..., description="Unique identifier")
    name: str = Field(..., description="Analyzer name")
    analyzer_type: str = Field(..., description="Analyzer type")

    model_config = ConfigDict(from_attributes=True)


class AnalyzerResponse(AnalyzerBase):
    """
    Complete schema for analyzer data returned by the API.
    
    This is the base response; FTIR and OES responses extend this.
    """

    id: int = Field(..., description="Unique identifier")
    analyzer_type: str = Field(..., description="Type discriminator")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(
        default=None,
        description="Number of experiments using this analyzer"
    )

    is_in_use: Optional[bool] = Field(
        default=None,
        description="Whether analyzer is referenced by experiments"
    )

    # Optional relationships
    experiments: Optional[List["ExperimentSimple"]] = Field(
        default=None,
        description="Experiments using this analyzer (included when requested)"
    )

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# FTIR Schemas
# =============================================================================

class FTIRBase(AnalyzerBase):
    """
    Base schema for FTIR analyzers with FTIR-specific fields.
    """

    # FTIR-specific parameters
    path_length: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Optical path length through gas cell (cm)",
        examples=["10.0", "5.5"]
    )

    resolution: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Spectral resolution (cm⁻¹)",
        examples=["4.0", "2.0", "0.5"]
    )

    interval: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Data point spacing/sampling interval"
    )

    scans: Optional[int] = Field(
        None,
        ge=1,
        description="Number of scans averaged",
        examples=[32, 64, 128]
    )


class FTIRCreate(FTIRBase):
    """
    Schema for creating a new FTIR analyzer.
    """

    analyzer_type: Literal['ftir'] = Field(
        default='ftir',
        description="Type discriminator (always 'ftir')"
    )


class FTIRUpdate(BaseModel):
    """
    Schema for updating an FTIR analyzer.
    """

    # Base fields
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

    # FTIR-specific fields
    path_length: Optional[Decimal] = Field(None, ge=0)
    resolution: Optional[Decimal] = Field(None, ge=0)
    interval: Optional[Decimal] = Field(None, ge=0)
    scans: Optional[int] = Field(None, ge=1)


class FTIRResponse(FTIRBase):
    """
    Complete schema for FTIR analyzer data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    analyzer_type: Literal['ftir'] = Field(default='ftir')
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(default=None)
    is_in_use: Optional[bool] = Field(default=None)

    # Optional relationships
    experiments: Optional[List["ExperimentSimple"]] = Field(default=None)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Nicolet iS50 FTIR",
                    "analyzer_type": "ftir",
                    "description": "Main lab FTIR with 10cm gas cell",
                    "path_length": "10.0000",
                    "resolution": "4.0000",
                    "interval": "1.0000",
                    "scans": 64,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 25,
                    "is_in_use": True
                }
            ]
        }
    )


# =============================================================================
# OES Schemas
# =============================================================================

class OESBase(AnalyzerBase):
    """
    Base schema for OES analyzers with OES-specific fields.
    """

    # OES-specific parameters
    integration_time: Optional[int] = Field(
        None,
        ge=1,
        description="Integration/exposure time (ms)",
        examples=[100, 500, 1000]
    )

    scans: Optional[int] = Field(
        None,
        ge=1,
        description="Number of spectra averaged",
        examples=[10, 50, 100]
    )


class OESCreate(OESBase):
    """
    Schema for creating a new OES analyzer.
    """

    analyzer_type: Literal['oes'] = Field(
        default='oes',
        description="Type discriminator (always 'oes')"
    )


class OESUpdate(BaseModel):
    """
    Schema for updating an OES analyzer.
    """

    # Base fields
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

    # OES-specific fields
    integration_time: Optional[int] = Field(None, ge=1)
    scans: Optional[int] = Field(None, ge=1)


class OESResponse(OESBase):
    """
    Complete schema for OES analyzer data returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    analyzer_type: Literal['oes'] = Field(default='oes')
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed properties
    experiment_count: Optional[int] = Field(default=None)
    is_in_use: Optional[bool] = Field(default=None)

    # Optional relationships
    experiments: Optional[List["ExperimentSimple"]] = Field(default=None)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 2,
                    "name": "Ocean Optics USB4000",
                    "analyzer_type": "oes",
                    "description": "Fiber-coupled OES for plasma diagnostics",
                    "integration_time": 500,
                    "scans": 50,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "experiment_count": 18,
                    "is_in_use": True
                }
            ]
        }
    )


# =============================================================================
# Union Types for Polymorphic Handling
# =============================================================================

# For creating analyzers (router determines type from analyzer_type field)
AnalyzerCreateUnion = Union[FTIRCreate, OESCreate]

# For responses (router returns appropriate type based on analyzer_type)
AnalyzerResponseUnion = Union[FTIRResponse, OESResponse]
