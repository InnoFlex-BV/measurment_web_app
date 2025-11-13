"""
Core infrastructure models.

This subdomain contains fundamental models that support the entire application,
including users and file management.
"""

from app.models.core.user import User

__all__ = [
    "User",
]