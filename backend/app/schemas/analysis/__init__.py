"""
Analysis domain schemas.

Pydantic schemas for analytical chemistry entities:
- Characterization: Schemas for analytical measurement records
- Observation: Schemas for qualitative research notes

These schemas handle:
- JSONB fields for flexible structured data (observations)
- File attachments for raw/processed data (characterizations)
- Many-to-many relationships with catalysts and samples
"""

from app.schemas.analysis.characterization import (
    CharacterizationBase,
    CharacterizationCreate,
    CharacterizationUpdate,
    CharacterizationSimple,
    CharacterizationResponse
)

from app.schemas.analysis.observation import (
    ObservationBase,
    ObservationCreate,
    ObservationUpdate,
    ObservationSimple,
    ObservationResponse
)

__all__ = [
    # Characterization schemas
    "CharacterizationBase",
    "CharacterizationCreate",
    "CharacterizationUpdate",
    "CharacterizationSimple",
    "CharacterizationResponse",
    # Observation schemas
    "ObservationBase",
    "ObservationCreate",
    "ObservationUpdate",
    "ObservationSimple",
    "ObservationResponse",
]