"""
Analysis domain routers.

API endpoints for analytical chemistry entities:
- Characterizations: Analytical measurement records
- Observations: Qualitative research notes

These routers provide CRUD operations and relationship management
for linking analysis records to catalysts, samples, files, and users.
"""

from app.routers.analysis.characterizations import router as characterizations_router
from app.routers.analysis.observations import router as observations_router

__all__ = [
    "characterizations_router",
    "observations_router",
]