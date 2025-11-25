"""
Core infrastructure models.

This subdomain contains fundamental models that support the entire application:
- User: Research personnel who work with the system
- File: Metadata for uploaded files (Phase 3)

These models are referenced by many other entities throughout the system
for audit tracking and file attachments.
"""

from app.models.core.user import User
# File will be added in Phase 3
# from app.models.core.file import File

__all__ = [
    "User",
    # "File",  # Phase 3
]
