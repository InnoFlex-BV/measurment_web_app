"""
Core infrastructure schemas.

Pydantic schemas for fundamental application entities:
- User: Research personnel
- File: File metadata (Phase 3)

These schemas are used across all domains for audit tracking,
file attachments, and user management.
"""

from app.schemas.core.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserSimple,
    UserResponse
)
# File schemas will be added in Phase 3
# from app.schemas.core.file import (
#     FileBase, FileCreate, FileUpdate, FileResponse
# )

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserSimple",
    "UserResponse",
    # File (Phase 3)
    # "FileBase", "FileCreate", "FileUpdate", "FileResponse",
]
