"""
File model representing attachments to experiments.

Files store metadata about uploaded files like photos, data files, or reports.
The actual file bytes are stored on the filesystem or object storage.
"""

from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class File(Base):
    """
    File model for experiment attachments.
    
    Stores metadata about files attached to experiments. The actual file bytes
    are stored externally (filesystem or cloud storage), and this table tracks
    where they are and what they contain.
    """

    __tablename__ = "files"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to experiments table
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Original filename as uploaded
    filename = Column(String(255), nullable=False)

    # File size in bytes for validation and storage tracking
    # BigInteger can handle files up to 9 exabytes
    file_size = Column(BigInteger, nullable=False)

    # MIME type for proper handling when serving files
    # Examples: "image/png", "application/pdf", "text/csv"
    mime_type = Column(String(100), nullable=False)

    # Path where the file is actually stored
    # Could be local filesystem path or cloud storage URL
    # Example: "/var/lab_files/experiments/123/data.csv"
    storage_path = Column(String(500), nullable=False)

    # Description of what this file contains
    description = Column(Text, nullable=True)

    # Who uploaded this file (might be different from experiment conductor)
    uploaded_by = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True
    )

    # Upload timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship to the parent experiment
    experiment = relationship("Experiment", back_populates="files")

    # Relationship to the user who uploaded the file
    uploader = relationship("User", back_populates="uploaded_files")

    def __repr__(self):
        return f"<File(id={self.id}, filename='{self.filename}', size={self.file_size})>"