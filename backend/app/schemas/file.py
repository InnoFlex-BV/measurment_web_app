"""
Pydantic schemas for File entity.

Files store metadata about attachments to experiments.
The actual file bytes are stored on disk, not in the database.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class FileBase(BaseModel):
    """
    Base schema for file metadata.
    """

    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename as uploaded"
    )

    mime_type: str = Field(
        ...,
        max_length=100,
        description="MIME type (e.g., 'image/png', 'application/pdf')"
    )

    description: Optional[str] = Field(
        None,
        description="Description of what this file contains"
    )


class FileCreate(FileBase):
    """
    Schema for file metadata when uploading.
    
    The actual file bytes come through multipart form data,
    while this schema validates the metadata fields.
    """

    pass  # file_size and storage_path are calculated by the upload handler


class FileResponse(FileBase):
    """
    Schema for file metadata returned by the API.
    """

    id: int = Field(..., description="Unique identifier")
    experiment_id: int = Field(..., description="ID of the experiment")
    file_size: int = Field(..., description="File size in bytes")
    storage_path: str = Field(..., description="Where the file is stored")
    uploaded_by: Optional[int] = Field(None, description="ID of user who uploaded")
    created_at: datetime = Field(..., description="When the file was uploaded")

    model_config = ConfigDict(from_attributes=True)