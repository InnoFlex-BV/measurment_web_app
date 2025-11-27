"""
Reference domain schemas.

Pydantic schemas for lookup tables and supporting data:
- Contaminant: Target pollutant compounds (with ppm in junction)
- Carrier: Carrier/balance gases (with ratio in junction)
- Group: Experiment groupings for analysis

These schemas include special variants for junction table data
(ContaminantWithPpm, CarrierWithRatio) and data input schemas
(ContaminantExperimentData, CarrierExperimentData).
"""

from app.schemas.reference.contaminant import (
    ContaminantBase,
    ContaminantCreate,
    ContaminantUpdate,
    ContaminantSimple,
    ContaminantWithPpm,
    ContaminantResponse,
    ContaminantExperimentData
)
from app.schemas.reference.carrier import (
    CarrierBase,
    CarrierCreate,
    CarrierUpdate,
    CarrierSimple,
    CarrierWithRatio,
    CarrierResponse,
    CarrierExperimentData
)
from app.schemas.reference.group import (
    GroupBase,
    GroupCreate,
    GroupUpdate,
    GroupSimple,
    GroupResponse
)

__all__ = [
    # Contaminant
    "ContaminantBase",
    "ContaminantCreate",
    "ContaminantUpdate",
    "ContaminantSimple",
    "ContaminantWithPpm",
    "ContaminantResponse",
    "ContaminantExperimentData",
    # Carrier
    "CarrierBase",
    "CarrierCreate",
    "CarrierUpdate",
    "CarrierSimple",
    "CarrierWithRatio",
    "CarrierResponse",
    "CarrierExperimentData",
    # Group
    "GroupBase",
    "GroupCreate",
    "GroupUpdate",
    "GroupSimple",
    "GroupResponse",
]