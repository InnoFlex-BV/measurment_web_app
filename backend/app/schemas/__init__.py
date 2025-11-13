"""
Pydantic schemas for API request/response validation.

Schemas define how data crosses the API boundary, providing validation
for incoming requests and serialization for outgoing responses. They're
organized into subdirectories mirroring the models organization:
- core: Infrastructure schemas (users, files)
- catalysts: Catalyst domain schemas

Each entity typically has four schema classes:
- Base: Common fields used by multiple schemas
- Create: Fields for creating new entities (excludes generated fields)
- Update: Fields for updating (all optional for partial updates)
- Response: Complete entity as returned by API (includes generated fields)
"""

# Import from subdomains
from app.schemas.core import (
    UserBase, UserCreate, UserUpdate, UserResponse
)

from app.schemas.catalysts import (
    ChemicalBase, ChemicalCreate, ChemicalUpdate, ChemicalResponse,
    MethodBase, MethodCreate, MethodUpdate, MethodResponse,
    SupportBase, SupportCreate, SupportUpdate, SupportResponse,
    CatalystBase, CatalystCreate, CatalystUpdate, CatalystResponse
)

# Export all schemas
__all__ = [
    # Core schemas
    "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    # Catalyst domain schemas
    "ChemicalBase", "ChemicalCreate", "ChemicalUpdate", "ChemicalResponse",
    "MethodBase", "MethodCreate", "MethodUpdate", "MethodResponse",
    "SupportBase", "SupportCreate", "SupportUpdate", "SupportResponse",
    "CatalystBase", "CatalystCreate", "CatalystUpdate", "CatalystResponse",
]