"""
Application routers package.

This package contains all FastAPI routers organized by domain.

Domains:
--------
- core: Fundamental infrastructure
  - /api/users, /api/files
  
- catalysts: Catalyst synthesis and inventory
  - /api/catalysts, /api/samples, /api/methods, /api/chemicals, /api/supports
  
- analysis: Analytical chemistry measurements
  - /api/characterizations, /api/observations
  
- experiments: Performance testing
  - /api/experiments, /api/waveforms, /api/reactors, /api/processed, /api/analyzers
  
- reference: Supporting reference data
  - /api/contaminants, /api/carriers, /api/groups

Router Registration:
-------------------
Routers are registered in main.py using app.include_router().
Each router defines its own prefix and tags.
"""

# =============================================================================
# Core Domain
# =============================================================================
from app.routers.core.users import router as users_router
from app.routers.core.files import router as files_router
from app.routers.core.audit import router as audit_router

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
# Experiments Domain
# =============================================================================
from app.routers.experiments.waveforms import router as waveforms_router
from app.routers.experiments.reactors import router as reactors_router
from app.routers.experiments.processed import router as processed_router
from app.routers.experiments.analyzers import router as analyzers_router
from app.routers.experiments.experiments import router as experiments_router

# =============================================================================
# Reference Domain
# =============================================================================
from app.routers.reference.contaminants import router as contaminants_router
from app.routers.reference.carriers import router as carriers_router
from app.routers.reference.groups import router as groups_router

# =============================================================================
# All routers for easy import
# =============================================================================
all_routers = [
    # Core
    users_router,
    files_router,
    audit_router,
    # Catalysts
    catalysts_router,
    samples_router,
    methods_router,
    chemicals_router,
    supports_router,
    # Analysis
    characterizations_router,
    observations_router,
    # Experiments
    waveforms_router,
    reactors_router,
    processed_router,
    analyzers_router,
    experiments_router,
    # Reference
    contaminants_router,
    carriers_router,
    groups_router,
]

__all__ = [
    # Router list
    "all_routers",
    # Core
    "users_router",
    "files_router",
    "audit_router",
    # Catalysts
    "catalysts_router",
    "samples_router",
    "methods_router",
    "chemicals_router",
    "supports_router",
    # Analysis
    "characterizations_router",
    "observations_router",
    # Experiments
    "waveforms_router",
    "reactors_router",
    "processed_router",
    "analyzers_router",
    "experiments_router",
    # Reference
    "contaminants_router",
    "carriers_router",
    "groups_router",
]
