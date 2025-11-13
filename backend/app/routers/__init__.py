"""
API routers organized by domain.

Routers are grouped into subdirectories matching the models and schemas
organization for consistency and maintainability.
"""

from app.routers.core import users_router
from app.routers.catalysts import (
    chemicals_router,
    methods_router,
    supports_router,
    catalysts_router
)

__all__ = [
    "users_router",
    "chemicals_router",
    "methods_router",
    "supports_router",
    "catalysts_router",
]
