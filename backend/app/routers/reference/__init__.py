"""
Reference domain routers.

API endpoints for lookup tables and supporting data:
- Contaminants: Target pollutant compounds
- Carriers: Carrier/balance gases
- Groups: Experiment groupings for analysis
"""

from app.routers.reference.contaminants import router as contaminants_router
from app.routers.reference.carriers import router as carriers_router
from app.routers.reference.groups import router as groups_router

__all__ = [
    "contaminants_router",
    "carriers_router",
    "groups_router",
]