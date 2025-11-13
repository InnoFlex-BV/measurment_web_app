"""
Core infrastructure schemas.

These schemas define the API interface for fundamental entities that
support the entire application.
"""

from app.schemas.core.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
]