"""
Core infrastructure models.

This subdomain contains fundamental models that support the entire application:
- User: Research personnel who work with the system
- File: Metadata for uploaded files

These models are referenced by many other entities throughout the system
for audit tracking and file attachments.
"""

from app.models.core.user import User
from app.models.core.file import File

__all__ = [
    "User",
    "File",
]
