"""
Application schemas package.

This package contains all Pydantic schemas organized by domain.
Schemas are used for request/response validation in FastAPI endpoints.

Schema Naming Convention:
------------------------
Each entity typically has these schema variants:
- Base: Common fields shared across operations
- Create: Fields for POST requests (excludes generated fields)
- Update: Optional fields for PATCH requests
- Simple: Minimal fields for nested representations
- Response: Complete fields for GET responses

Domains:
--------
- catalysts: Catalyst synthesis and inventory
- analysis: Analytical chemistry measurements
- experiments: Performance testing (Phase 3)
- reference: Supporting reference data (Phase 4)
- core: Fundamental infrastructure (User, File)

Usage:
------
Schemas can be imported directly:
    from app.schemas import CatalystCreate, CatalystResponse
    
Or from domain subpackages:
    from app.schemas.catalysts import CatalystCreate
    from app.schemas.analysis import CharacterizationResponse
"""

# =============================================================================
# Core Domain
# =============================================================================
from app.schemas.core.user import (
    UserBase, UserCreate, UserUpdate, UserSimple, UserResponse
)

# =============================================================================
# Catalyst Domain
# =============================================================================
from app.schemas.catalysts.chemical import (
    ChemicalBase, ChemicalCreate, ChemicalUpdate,
    ChemicalSimple, ChemicalResponse
)
from app.schemas.catalysts.method import (
    MethodBase, MethodCreate, MethodUpdate,
    MethodSimple, MethodResponse
)
from app.schemas.catalysts.support import (
    SupportBase, SupportCreate, SupportUpdate, SupportResponse
)
from app.schemas.catalysts.catalyst import (
    CatalystBase, CatalystCreate, CatalystUpdate,
    CatalystSimple, CatalystResponse
)
from app.schemas.catalysts.sample import (
    SampleBase, SampleCreate, SampleUpdate,
    SampleSimple, SampleResponse
)

# =============================================================================
# Analysis Domain
# =============================================================================
from app.schemas.analysis.characterization import (
    CharacterizationBase, CharacterizationCreate, CharacterizationUpdate,
    CharacterizationSimple, CharacterizationResponse
)
from app.schemas.analysis.observation import (
    ObservationBase, ObservationCreate, ObservationUpdate,
    ObservationSimple, ObservationResponse
)

# =============================================================================
# Experiments Domain (Phase 3)
# =============================================================================
# Experiment schemas will be added here

# =============================================================================
# Reference Domain (Phase 4)
# =============================================================================
# Reference schemas will be added here

# =============================================================================
# Exports
# =============================================================================
__all__ = [
    # Core
    "UserBase", "UserCreate", "UserUpdate", "UserSimple", "UserResponse",

    # Catalysts - Chemical
    "ChemicalBase", "ChemicalCreate", "ChemicalUpdate",
    "ChemicalSimple", "ChemicalResponse",

    # Catalysts - Method
    "MethodBase", "MethodCreate", "MethodUpdate",
    "MethodSimple", "MethodResponse",

    # Catalysts - Support
    "SupportBase", "SupportCreate", "SupportUpdate", "SupportResponse",

    # Catalysts - Catalyst
    "CatalystBase", "CatalystCreate", "CatalystUpdate",
    "CatalystSimple", "CatalystResponse",

    # Catalysts - Sample
    "SampleBase", "SampleCreate", "SampleUpdate",
    "SampleSimple", "SampleResponse",

    # Analysis - Characterization
    "CharacterizationBase", "CharacterizationCreate", "CharacterizationUpdate",
    "CharacterizationSimple", "CharacterizationResponse",

    # Analysis - Observation
    "ObservationBase", "ObservationCreate", "ObservationUpdate",
    "ObservationSimple", "ObservationResponse",
]
