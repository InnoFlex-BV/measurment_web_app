"""
File API router.

Files track metadata about uploaded documents, images, data files, and
other attachments. This router provides CRUD operations for file metadata.

Note: This router handles metadata only. Actual file upload/download
operations would be handled by a separate storage service.

Endpoint Summary:
- GET    /api/files/           List files with filtering
- POST   /api/files/           Create file metadata record
- GET    /api/files/{id}       Get file details
- PATCH  /api/files/{id}       Update file metadata
- DELETE /api/files/{id}       Soft delete file
- POST   /api/files/{id}/restore  Restore soft-deleted file
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.core.file import File
from app.models.core.user import User
from app.schemas.core.file import (
    FileCreate, FileUpdate, FileResponse
)

router = APIRouter(
    prefix="/api/files",
    tags=["Files"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[FileResponse])
def list_files(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in filename"),
        mime_type: Optional[str] = Query(None, description="Filter by MIME type prefix"),
        uploaded_by: Optional[int] = Query(None, description="Filter by uploader user ID"),
        include_deleted: bool = Query(False, description="Include soft-deleted files"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: uploader"
        ),
        db: Session = Depends(get_db)
):
    """
    List files with filtering and search.
    
    By default, soft-deleted files are excluded. Use include_deleted=true
    to include them.
    """

    query = db.query(File)

    # Exclude deleted by default
    if not include_deleted:
        query = query.filter(File.is_deleted == False)

    # Apply filters
    if search:
        query = query.filter(File.filename.ilike(f"%{search}%"))

    if mime_type:
        query = query.filter(File.mime_type.ilike(f"{mime_type}%"))

    if uploaded_by is not None:
        query = query.filter(File.uploaded_by == uploaded_by)

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'uploader' in include_rels:
            query = query.options(joinedload(File.uploader))

    # Order by creation date (newest first)
    query = query.order_by(File.created_at.desc())

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{file_id}", response_model=FileResponse)
def get_file(
        file_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single file by ID.
    """

    query = db.query(File)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'uploader' in include_rels:
            query = query.options(joinedload(File.uploader))

    file = query.filter(File.id == file_id).first()

    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )

    return file


@router.post("/", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_file(
        file: FileCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new file metadata record.
    
    This creates the metadata record only. The actual file should be
    uploaded separately to the storage backend, and the storage_path
    should reference where the file was stored.
    """

    # Validate uploader if provided
    if file.uploaded_by:
        uploader = db.query(User).filter(User.id == file.uploaded_by).first()
        if not uploader:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with ID {file.uploaded_by} not found"
            )

    db_file = File(**file.model_dump())
    db.add(db_file)

    try:
        db.commit()
        db.refresh(db_file)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_file


@router.patch("/{file_id}", response_model=FileResponse)
def update_file(
        file_id: int,
        file_update: FileUpdate,
        db: Session = Depends(get_db)
):
    """
    Update file metadata.
    
    Only description and is_deleted can be updated. Core metadata like
    filename, storage_path, checksum are immutable after creation.
    """

    db_file = db.query(File).filter(File.id == file_id).first()

    if db_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )

    update_data = file_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_file, field, value)

    db.commit()
    db.refresh(db_file)

    return db_file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
        file_id: int,
        hard_delete: bool = Query(
            False,
            description="Permanently delete instead of soft delete"
        ),
        db: Session = Depends(get_db)
):
    """
    Delete a file.
    
    By default, performs soft delete (sets is_deleted=True).
    Use hard_delete=true to permanently remove the record.
    
    Note: Hard delete does not remove the actual file from storage.
    """

    db_file = db.query(File).filter(File.id == file_id).first()

    if db_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )

    if hard_delete:
        db.delete(db_file)
    else:
        db_file.is_deleted = True

    db.commit()

    return None


@router.post("/{file_id}/restore", response_model=FileResponse)
def restore_file(
        file_id: int,
        db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted file.
    """

    db_file = db.query(File).filter(File.id == file_id).first()

    if db_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )

    if not db_file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not deleted"
        )

    db_file.is_deleted = False
    db.commit()
    db.refresh(db_file)

    return db_file


# =============================================================================
# Utility Endpoints
# =============================================================================

@router.get("/by-checksum/{checksum}", response_model=FileResponse)
def get_file_by_checksum(
        checksum: str,
        db: Session = Depends(get_db)
):
    """
    Find a file by its checksum.
    
    Useful for deduplication - check if a file with the same content
    already exists before uploading.
    """

    file = db.query(File).filter(
        File.checksum == checksum,
        File.is_deleted == False
    ).first()

    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No file found with checksum {checksum}"
        )

    return file