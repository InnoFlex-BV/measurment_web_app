"""
Pydantic schemas for File entity.

Files track metadata about uploaded documents, images, data files, and
other attachments. The actual file content is stored externally while
this model tracks metadata, location, and integrity information.

Note: This schema handles metadata only. File upload/download is handled
by separate endpoints that work with the storage backend.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Any

from app.schemas.core.user import UserSimple

class FileBase(BaseModel):
    """
    Base schema for files with core metadata fields.
    """

    # Original filename
    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename",
        examples=["experiment_data.csv", "tem_image_001.png"]
    )

    # MIME type
    mime_type: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="MIME type of the file",
        examples=["text/csv", "image/png", "application/pdf"]
    )

    # Storage path
    storage_path: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Path to file in storage system",
        examples=["/data/uploads/2024/01/abc123.csv"]
    )

    # File size in bytes
    file_size: int = Field(
        ...,
        gt=0,
        description="File size in bytes",
        examples=[1024, 1048576]
    )

    # Checksum for integrity
    checksum: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="File checksum (SHA-256)",
        examples=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"]
    )

    # Optional description
    description: Optional[str] = Field(
        None,
        description="Description of file contents"
    )


class FileCreate(FileBase):
    """
    Schema for creating a new file record.
    
    The uploaded_by field links to the user who uploaded the file.
    """

    uploaded_by: Optional[int] = Field(
        None,
        gt=0,
        description="ID of user who uploaded the file"
    )


class FileUpdate(BaseModel):
    """
    Schema for updating file metadata.
    
    Most fields are immutable (filename, storage_path, etc.).
    Only description and is_deleted can be updated.
    """

    description: Optional[str] = Field(
        None,
        description="Updated description"
    )

    is_deleted: Optional[bool] = Field(
        None,
        description="Soft delete flag"
    )


class FileSimple(BaseModel):
    """
    Simplified schema for nested representations.
    
    Used when files appear in relationship lists.
    """

    id: int = Field(..., description="Unique identifier")
    filename: str = Field(..., description="Original filename")
    mime_type: str = Field(..., description="MIME type")
    file_size: int = Field(..., description="File size in bytes")

    model_config = ConfigDict(from_attributes=True)


class FileResponse(FileBase):
    """
    Complete schema for file data returned by the API.
    
    Includes metadata, computed properties, and optional relationships.
    """

    id: int = Field(..., description="Unique identifier")
    uploaded_by: Optional[int] = Field(None, description="Uploader user ID")
    is_deleted: bool = Field(..., description="Soft deletion flag")
    created_at: datetime = Field(..., description="Upload timestamp")

    # Note: Files have no updated_at in the database

    # Computed properties (from model)
    file_size_display: Optional[str] = Field(
        default=None,
        description="Human-readable file size"
    )

    extension: Optional[str] = Field(
        default=None,
        description="File extension"
    )

    is_image: Optional[bool] = Field(
        default=None,
        description="Whether file is an image"
    )

    is_pdf: Optional[bool] = Field(
        default=None,
        description="Whether file is a PDF"
    )

    # Optional relationships
    uploader: Optional[UserSimple] = Field(
        default=None,
        description="User who uploaded (included when requested)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "filename": "xrd_pattern_tio2.csv",
                    "mime_type": "text/csv",
                    "storage_path": "/data/uploads/2024/01/abc123.csv",
                    "file_size": 15360,
                    "checksum": "e3b0c44298fc1c149afbf4c8996fb924...",
                    "description": "XRD pattern for TiO2 catalyst",
                    "uploaded_by": 1,
                    "is_deleted": False,
                    "created_at": "2024-01-15T10:30:00Z",
                    "file_size_display": "15.0 KB",
                    "extension": "csv",
                    "is_image": False,
                    "is_pdf": False
                }
            ]
        }
    )