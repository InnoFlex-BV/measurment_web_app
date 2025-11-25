"""
Catalyst domain schemas.

Pydantic schemas for catalyst synthesis and inventory entities:
- Catalyst: Synthesized catalyst materials
- Sample: Prepared portions for testing (Phase 2)
- Method: Synthesis procedures
- Chemical: Chemical compounds
- Support: Substrate materials

Each entity has a standard set of schemas:
- Base: Common fields
- Create: For POST requests
- Update: For PATCH requests (all optional)
- Simple: Minimal for nested responses
- Response: Complete for API responses
"""

# Chemical schemas
from app.schemas.catalysts.chemical import (
    ChemicalBase,
    ChemicalCreate,
    ChemicalUpdate,
    ChemicalSimple,
    ChemicalResponse
)

# Method schemas
from app.schemas.catalysts.method import (
    MethodBase,
    MethodCreate,
    MethodUpdate,
    MethodSimple,
    MethodResponse
)

# Support schemas
from app.schemas.catalysts.support import (
    SupportBase,
    SupportCreate,
    SupportUpdate,
    SupportResponse
)

# Catalyst schemas
from app.schemas.catalysts.catalyst import (
    CatalystBase,
    CatalystCreate,
    CatalystUpdate,
    CatalystSimple,
    CatalystResponse
)

# Sample schemas (Phase 2)
from app.schemas.catalysts.sample import (
    SampleBase,
    SampleCreate,
    SampleUpdate,
    SampleSimple,
    SampleResponse
)

__all__ = [
    # Chemical
    "ChemicalBase", "ChemicalCreate", "ChemicalUpdate",
    "ChemicalSimple", "ChemicalResponse",
    # Method
    "MethodBase", "MethodCreate", "MethodUpdate",
    "MethodSimple", "MethodResponse",
    # Support
    "SupportBase", "SupportCreate", "SupportUpdate", "SupportResponse",
    # Catalyst
    "CatalystBase", "CatalystCreate", "CatalystUpdate",
    "CatalystSimple", "CatalystResponse",
    # Sample
    "SampleBase", "SampleCreate", "SampleUpdate",
    "SampleSimple", "SampleResponse",
]
