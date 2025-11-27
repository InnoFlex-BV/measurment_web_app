"""
Core infrastructure schemas.

Pydantic schemas for fundamental application entities:
- User: Research personnel
- File: File metadata

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
from app.schemas.core.file import (
    FileBase,
    FileCreate,
    FileUpdate,
    FileSimple,
    FileResponse
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserSimple",
    "UserResponse",
    # File
    "FileBase",
    "FileCreate",
    "FileUpdate",
    "FileSimple",
    "FileResponse",
]
