"""
Catalyst domain routers.

These routers provide API endpoints for all catalyst-related entities.
"""

from app.routers.catalysts.chemicals import router as chemicals_router
from app.routers.catalysts.methods import router as methods_router
from app.routers.catalysts.supports import router as supports_router
from app.routers.catalysts.catalysts import router as catalysts_router

__all__ = [
    "chemicals_router",
    "methods_router",
    "supports_router",
    "catalysts_router",
]