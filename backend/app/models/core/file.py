"""
File model representing uploaded file metadata.

Files track metadata about uploaded documents, images, data files, and other
attachments used throughout the system. The actual file content is stored
externally (filesystem or object storage), while this model tracks:
- Where the file is stored (storage_path)
- What type of file it is (mime_type)
- Who uploaded it (uploaded_by)
- File integrity (checksum)
- Soft deletion status (is_deleted)

Files are referenced by many entities:
- Characterizations: raw_data, processed_data
- Observations: supporting documentation (via observation_file junction)
- Experiments: raw_data, figures, discussed_in, measured_waveform
- Groups: discussed_in

Database Schema (from 01_init.sql):
-----------------------------------
create table files (
    id serial primary key,
    filename varchar(255) not null,
    mime_type varchar(255) not null,
    storage_path varchar(500) not null,
    description text,
    uploaded_by integer references users(id) on delete set null,
    created_at timestamp with time zone default current_timestamp not null,
    file_size bigint not null,
    checksum varchar(255) not null,
    is_deleted boolean not null default false
);

Design Notes:
-------------
- No updated_at column - files are immutable once uploaded
- Soft deletion via is_deleted flag preserves referential integrity
- checksum enables integrity verification
- storage_path points to actual file location (filesystem or S3)
"""

from sqlalchemy import Column, Integer, String, Text, BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class File(Base):
    """
    File model for tracking uploaded file metadata.
    
    This model stores metadata only - actual file content is stored
    externally and referenced by storage_path. This separation allows:
    - Database stays lightweight (no BLOBs)
    - Files can be stored on any backend (local, S3, GCS)
    - Easy migration between storage backends
    
    Common file types in catalyst research:
    - Data files: CSV, Excel, instrument-specific formats
    - Images: TEM/SEM micrographs, XRD patterns, spectra
    - Documents: PDFs, Word docs, lab notebooks
    - Figures: PNG, SVG for publications
    
    Soft Deletion:
    --------------
    Files use soft deletion (is_deleted flag) rather than hard deletion.
    This preserves referential integrity - if an experiment references
    a file, deleting that file won't break the experiment record.
    Soft-deleted files can be excluded from queries but recovered if needed.
    """

    __tablename__ = "files"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Original filename as uploaded
    # Preserved for display and download purposes
    # The actual stored file may have a different name (e.g., UUID-based)
    filename = Column(String(255), nullable=False)

    # MIME type for content type detection
    # Examples: "application/pdf", "image/png", "text/csv"
    # Used for proper Content-Type headers when serving files
    mime_type = Column(String(255), nullable=False)

    # Path to the actual file in storage
    # Could be a filesystem path or object storage key
    # Examples: "/data/uploads/2024/01/abc123.pdf"
    #           "s3://bucket/uploads/abc123.pdf"
    storage_path = Column(String(500), nullable=False)

    # Optional description of file contents
    # Useful for documenting what data the file contains
    description = Column(Text, nullable=True)

    # Who uploaded this file
    # SET NULL on delete preserves the file even if user is deleted
    uploaded_by = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )

    # When the file was uploaded
    # Note: No updated_at - files are immutable once uploaded
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # File size in bytes
    # BigInteger supports files up to ~9 exabytes
    file_size = Column(BigInteger, nullable=False)

    # File checksum for integrity verification
    # Typically SHA-256 hash of file contents
    # Allows detecting corruption or tampering
    checksum = Column(String(255), nullable=False)

    # Soft deletion flag
    # When True, file is considered deleted but record remains
    # Preserves referential integrity with other entities
    is_deleted = Column(Boolean, nullable=False, default=False)

    # =========================================================================
    # Relationships
    # =========================================================================

    # Many-to-one: User who uploaded this file
    uploader = relationship(
        "User",
        back_populates="uploaded_files",
        doc="User who uploaded this file"
    )

    # Note: Reverse relationships from Characterization, Experiment, etc.
    # are defined in those models since File is the "one" side

    def __repr__(self):
        """String representation for debugging."""
        return f"<File(id={self.id}, filename='{self.filename}', deleted={self.is_deleted})>"

    @property
    def file_size_mb(self) -> float:
        """File size in megabytes."""
        return self.file_size / (1024 * 1024) if self.file_size else 0.0

    @property
    def file_size_display(self) -> str:
        """Human-readable file size."""
        if self.file_size < 1024:
            return f"{self.file_size} B"
        elif self.file_size < 1024 * 1024:
            return f"{self.file_size / 1024:.1f} KB"
        elif self.file_size < 1024 * 1024 * 1024:
            return f"{self.file_size / (1024 * 1024):.1f} MB"
        else:
            return f"{self.file_size / (1024 * 1024 * 1024):.2f} GB"

    @property
    def extension(self) -> str:
        """File extension extracted from filename."""
        if '.' in self.filename:
            return self.filename.rsplit('.', 1)[-1].lower()
        return ''

    @property
    def is_image(self) -> bool:
        """Check if file is an image based on MIME type."""
        return self.mime_type.startswith('image/') if self.mime_type else False

    @property
    def is_pdf(self) -> bool:
        """Check if file is a PDF."""
        return self.mime_type == 'application/pdf'

    @property
    def is_data_file(self) -> bool:
        """Check if file is a data file (CSV, Excel, etc.)."""
        data_types = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        return self.mime_type in data_types