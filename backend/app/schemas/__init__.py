"""
Pydantic schemas for API request/response validation.

This package contains schemas that define the shape of data as it crosses
API boundaries. Schemas handle validation, serialization, and documentation.

Schemas are separate from SQLAlchemy models because they serve different purposes:
- Models represent data in the database with database-specific concerns
- Schemas represent data in API requests/responses with validation and documentation

The typical pattern for each entity is:
- Base schema: Common fields used by multiple schemas
- Create schema: Fields needed when creating a new entity
- Update schema: Fields that can be modified (usually all optional)
- Response schema: Complete entity as returned by the API, including generated fields
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin
)

from app.schemas.experiment_type import (
    ExperimentTypeBase,
    ExperimentTypeCreate,
    ExperimentTypeUpdate,
    ExperimentTypeResponse
)

from app.schemas.experiment import (
    ExperimentBase,
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse
)

from app.schemas.measurement import (
    MeasurementBase,
    MeasurementCreate,
    MeasurementUpdate,
    MeasurementResponse
)

from app.schemas.observation import (
    ObservationBase,
    ObservationCreate,
    ObservationUpdate,
    ObservationResponse
)

from app.schemas.file import (
    FileBase,
    FileCreate,
    FileResponse
)

# Export all schemas for easy importing
__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "ExperimentTypeBase",
    "ExperimentTypeCreate",
    "ExperimentTypeUpdate",
    "ExperimentTypeResponse",
    "ExperimentBase",
    "ExperimentCreate",
    "ExperimentUpdate",
    "ExperimentResponse",
    "MeasurementBase",
    "MeasurementCreate",
    "MeasurementUpdate",
    "MeasurementResponse",
    "ObservationBase",
    "ObservationCreate",
    "ObservationUpdate",
    "ObservationResponse",
    "FileBase",
    "FileCreate",
    "FileResponse",
]