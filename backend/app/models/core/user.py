"""
User model representing researchers and lab personnel.

Users in this system represent people who work with catalysts, samples,
experiments, and other research artifacts. The user tracking tables
(user_catalyst, user_sample, etc.) record which users worked on which
entities, creating an audit trail of who contributed to each piece of research.

This model does not include authentication fields. In a production system,
authentication would be handled separately, potentially through an external
identity provider or a separate authentication service.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """
    User model for tracking research personnel.
    
    Users are referenced by many other entities through audit tracking tables.
    When someone creates or modifies a catalyst, sample, experiment, or other
    research artifact, a record is created in the corresponding user tracking
    table (like user_catalyst or user_experiment) to maintain a history of
    who worked on what.
    
    The is_active flag allows deactivating users without deleting them,
    which preserves the integrity of historical records. A deactivated user's
    past work remains visible in the system even though they can no longer
    create new work.
    """

    __tablename__ = "users"

    # Primary key - unique identifier for each user
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Username should be a short identifier like "jsmith"
    # This might match their network login or email prefix
    username = Column(String(100), unique=True, nullable=False, index=True)

    # Full name for display in the UI and reports
    full_name = Column(String(100), nullable=False)

    # Email for notifications and communication
    # Must be unique across all users
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Whether this user account is currently active
    # Inactive users cannot create new records but their historical
    # contributions remain visible
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamp tracking when the user account was created
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to user information
    # The trigger function update_updated_at_column() automatically
    # updates this whenever the row changes
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships to entities this user has worked on
    # These relationships go through the user tracking junction tables
    # and represent the audit trail of the user's contributions

    # Files uploaded by this user
    # This is a direct relationship through the uploaded_by foreign key
    # When a user is deleted, the uploaded_by field is set to NULL
    # rather than deleting the files (ON DELETE SET NULL)
    # TODO: uncomment once File is implemented
    # uploaded_files = relationship(
    #     "File",
    #     back_populates="uploader",
    #     foreign_keys="File.uploaded_by"
    # )

    # TODO: We'll add relationships to catalysts, samples, experiments, etc.
    # through the junction tables when we implement those models.
    # For now, we're keeping the User model focused on its core attributes.
    # Those relationships will be added in later phases.

    def __repr__(self):
        """
        String representation for debugging and logging.
        
        This appears when you print a User instance or view it in a debugger.
        Including username and email makes it easy to identify which user
        you're looking at in logs.
        """
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    @property
    def display_name(self):
        """
        Property that returns a formatted name for UI display.
        
        This provides a consistent way to show user names throughout the
        application. If you later decide to change the display format,
        you only need to change it here.
        """
        return self.full_name
