"""
Catalyst domain routers.

API endpoints for catalyst synthesis and inventory entities:
- Catalysts: Synthesized catalyst materials
- Samples: Prepared portions for testing (Phase 2)
- Methods: Synthesis procedures
- Chemicals: Chemical compounds
- Supports: Substrate materials
"""

from app.routers.catalysts.catalysts import router as catalysts_router
from app.routers.catalysts.samples import router as samples_router
from app.routers.catalysts.methods import router as methods_router
from app.routers.catalysts.chemicals import router as chemicals_router
from app.routers.catalysts.supports import router as supports_router

__all__ = [
    "catalysts_router",
    "samples_router",
    "methods_router",
    "chemicals_router",
    "supports_router",
]
