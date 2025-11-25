"""
Core infrastructure routers.

API endpoints for fundamental application entities:
- Users: Research personnel management
- Files: File metadata management (Phase 3)
"""

from app.routers.core.users import router as users_router
# File router will be added in Phase 3
# from app.routers.core.files import router as files_router

__all__ = [
    "users_router",
    # "files_router",  # Phase 3
]
