"""
Core infrastructure routers.

These routers provide API endpoints for fundamental system entities.
"""

from app.routers.core.users import router as users_router

__all__ = [
    "users_router",
]