"""
Core infrastructure routers.

API endpoints for fundamental application entities:
- Users: Research personnel management
- Files: File metadata management
- Audit: User contribution tracking
"""

from app.routers.core.users import router as users_router
from app.routers.core.files import router as files_router
from app.routers.core.audit import router as audit_router

__all__ = [
    "users_router",
    "files_router",
    "audit_router",
]
