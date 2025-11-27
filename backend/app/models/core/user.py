"""
User model representing researchers and lab personnel.

Users in this system represent people who work with catalysts, samples,
experiments, and other research artifacts. The user tracking tables
(user_catalyst, user_sample, etc.) record which users worked on which
entities, creating an audit trail of who contributed to each piece of research.

This model does not include authentication fields. In a production system,
authentication would be handled separately, potentially through an external
identity provider or a separate authentication service.

Relationship Summary (by Phase):
- Phase 1: catalysts (via user_catalyst)
- Phase 2: samples, characterizations, observations (via junction tables)
- Phase 3: experiments (via user_experiment)
- Phase 5: method_changes (via user_method association model)

The audit tracking junction tables all include a changed_at timestamp
to record when the user last interacted with each entity.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Import junction tables from their respective models
# These will be defined in the related model files
# We reference them here for the relationship definitions


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
    
    Future Authentication Considerations:
    -------------------------------------
    This model deliberately excludes authentication fields (password_hash,
    tokens, etc.) to keep concerns separated. When authentication is needed:
    
    Option 1: Add authentication fields to this model
    Option 2: Create a separate Credential model linked to User
    Option 3: Use external identity provider (OAuth, LDAP, SAML)
    
    Option 3 is recommended for production systems as it leverages
    established identity infrastructure and simplifies security compliance.
    """

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Username for login/identification
    # Unique constraint ensures no duplicate usernames
    username = Column(String(100), unique=True, nullable=False, index=True)

    # Full name for display purposes
    full_name = Column(String(100), nullable=False)

    # Email address
    # Unique constraint ensures no duplicate emails
    # Indexed for fast lookups during login/search
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Whether this user account is active
    # Inactive users can't perform actions but their historical
    # contributions remain visible
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # =========================================================================
    # Relationships - Organized by Phase
    # =========================================================================

    # --- Phase 1: Catalyst Domain ---

    # Many-to-many: Catalysts this user has worked on
    # Uses user_catalyst junction table defined in catalyst.py
    catalysts = relationship(
        "Catalyst",
        secondary="user_catalyst",
        back_populates="users",
        doc="Catalysts this user has worked on"
    )

    # --- Phase 2: Sample & Analysis Domain ---

    # Many-to-many: Samples this user has worked on
    # Uses user_sample junction table defined in sample.py
    samples = relationship(
        "Sample",
        secondary="user_sample",
        back_populates="users",
        doc="Samples this user has worked on"
    )

    # Many-to-many: Characterizations this user performed
    # Uses user_characterization junction table defined in characterization.py
    characterizations = relationship(
        "Characterization",
        secondary="user_characterization",
        back_populates="users",
        doc="Characterizations this user performed"
    )

    # Many-to-many: Observations this user made
    # Uses user_observation junction table defined in observation.py
    observations = relationship(
        "Observation",
        secondary="user_observation",
        back_populates="users",
        doc="Observations this user recorded"
    )

    # --- Phase 3: Experiment Domain ---

    # Many-to-many: Experiments this user participated in
    # Uses user_experiment junction table (to be defined in experiment.py)
    experiments = relationship(
        "Experiment",
        secondary="user_experiment",
        back_populates="users",
        doc="Experiments this user participated in"
    )

    # --- Phase 5: Method Modification History ---

    # One-to-many: Method modifications made by this user
    # Uses UserMethod association model for rich audit data
    method_changes = relationship(
        "UserMethod",
        back_populates="user",
        cascade="all, delete-orphan",
        doc="Method modification records for this user"
    )

    # --- File Uploads ---

    # One-to-many: Files uploaded by this user
    # Uses uploaded_by foreign key in File model
    uploaded_files = relationship(
        "File",
        back_populates="uploader",
        foreign_keys="[File.uploaded_by]",
        doc="Files uploaded by this user"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<User(id={self.id}, username='{self.username}', active={self.is_active})>"

    @property
    def display_name(self) -> str:
        """Return the best name to display for this user."""
        return self.full_name or self.username

    @property
    def catalyst_count(self) -> int:
        """Number of catalysts this user has worked on."""
        return len(self.catalysts) if self.catalysts else 0

    @property
    def sample_count(self) -> int:
        """Number of samples this user has worked on."""
        return len(self.samples) if self.samples else 0

    @property
    def characterization_count(self) -> int:
        """Number of characterizations this user performed."""
        return len(self.characterizations) if self.characterizations else 0

    @property
    def experiment_count(self) -> int:
        """Number of experiments this user participated in."""
        return len(self.experiments) if self.experiments else 0

    @property
    def total_contributions(self) -> int:
        """Total number of research artifacts this user contributed to."""
        return (
                self.catalyst_count +
                self.sample_count +
                self.characterization_count +
                self.experiment_count
        )
