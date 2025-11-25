"""
Application routers package.

This package contains all FastAPI routers organized by domain.

Domains:
--------
- catalysts: Catalyst synthesis and inventory
  - /api/catalysts, /api/samples, /api/methods, /api/chemicals, /api/supports
  
- analysis: Analytical chemistry measurements
  - /api/characterizations, /api/observations
  
- experiments: Performance testing (Phase 3)
  - /api/experiments, /api/reactors, /api/analyzers, /api/processed
  
- reference: Supporting reference data (Phase 4)
  - /api/contaminants, /api/carriers, /api/waveforms, /api/groups
  
- core: Fundamental infrastructure
  - /api/users, /api/files

Router Registration:
-------------------
Routers are registered in main.py using app.include_router().
Each router defines its own prefix and tags.
"""

# =============================================================================
# Core Domain
# =============================================================================
from app.routers.core.users import router as users_router
# files_router will be added in Phase 3

# =============================================================================
# Catalyst Domain
# =============================================================================
from app.routers.catalysts.catalysts import router as catalysts_router
from app.routers.catalysts.samples import router as samples_router
from app.routers.catalysts.methods import router as methods_router
from app.routers.catalysts.chemicals import router as chemicals_router
from app.routers.catalysts.supports import router as supports_router

# =============================================================================
# Analysis Domain
# =============================================================================
from app.routers.analysis.characterizations import router as characterizations_router
from app.routers.analysis.observations import router as observations_router

# =============================================================================
# Experiments Domain (Phase 3)
# =============================================================================
# Experiment routers will be added here

# =============================================================================
# Reference Domain (Phase 4)
# =============================================================================
# Reference routers will be added here

# =============================================================================
# All routers for easy import
# =============================================================================
all_routers = [
    # Core
    users_router,
    # Catalysts
    catalysts_router,
    samples_router,
    methods_router,
    chemicals_router,
    supports_router,
    # Analysis
    characterizations_router,
    observations_router,
]

__all__ = [
    # Router list
    "all_routers",
    # Individual routers
    "users_router",
    "catalysts_router",
    "samples_router",
    "methods_router",
    "chemicals_router",
    "supports_router",
    "characterizations_router",
    "observations_router",
]
