"""
Method model representing catalyst synthesis procedures.

Methods document the procedures used to create catalysts and samples.
They include the step-by-step instructions and link to the chemicals
used in the synthesis. Methods can be versioned and tracked for
reproducibility.

Phase 2 Additions:
- samples relationship: Track samples prepared using this method
- user_method relationship: Track method modification history with notes
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for the many-to-many relationship between methods and chemicals
# This table exists purely to connect methods with chemicals and has no
# attributes of its own beyond the two foreign keys.
chemical_method = Table(
    'chemical_method',
    Base.metadata,
    Column('method_id', Integer, ForeignKey('methods.id', ondelete='CASCADE'), primary_key=True),
    Column('chemical_id', Integer, ForeignKey('chemicals.id', ondelete='CASCADE'), primary_key=True)
)


# Note: user_method is NOT a simple junction table - it has its own id and change_notes
# This makes it an association object that tracks method modification history
# We'll define it as a proper model class below


class UserMethod(Base):
    """
    Association model for tracking method modifications by users.
    
    Unlike simple junction tables that just link two entities, user_method
    tracks the history of who modified methods and why. This is important
    for method versioning and audit trails.
    
    Each record represents a modification event:
    - Who made the change (user_id)
    - Which method was changed (method_id)
    - When it was changed (changed_at)
    - Why/what was changed (change_notes)
    
    This allows reconstructing the evolution of synthesis procedures
    over time, which is crucial for reproducibility.
    """

    __tablename__ = "user_method"

    # Primary key - this table has its own identity
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to user who made the modification
    user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Foreign key to method that was modified
    method_id = Column(
        Integer,
        ForeignKey('methods.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Timestamp of when the change was made
    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Notes describing what was changed and why
    # Important for understanding method evolution
    change_notes = Column(Text, nullable=True)

    # Relationships to parent entities
    # user = relationship("User", back_populates="method_changes")
    method = relationship("Method", back_populates="user_changes")

    def __repr__(self):
        return f"<UserMethod(id={self.id}, user_id={self.user_id}, method_id={self.method_id})>"


class Method(Base):
    """
    Method model representing catalyst synthesis procedures.
    
    Methods document how to create catalysts and samples. The procedure field
    contains the detailed step-by-step instructions, while the relationship
    to chemicals captures which chemical compounds are involved.
    
    The is_active flag allows deprecating old methods without deleting them.
    Inactive methods can't be used for new catalysts, but historical catalysts
    that used those methods retain that information for reproducibility.
    
    Key relationships:
    - chemicals: Many-to-many, which chemicals are used
    - catalysts: One-to-many, which catalysts were made with this method
    - samples: One-to-many, which samples were prepared with this method
    - user_changes: One-to-many, modification history with notes
    """

    __tablename__ = "methods"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descriptive name for this method
    # Should be unique and meaningful
    # Examples: "Sol-gel TiO2 synthesis", "Impregnation method for Pt/Al2O3"
    descriptive_name = Column(String(255), nullable=False)

    # Detailed procedure description
    # Step-by-step instructions for performing this synthesis
    # Should be detailed enough for reproducibility
    procedure = Column(Text, nullable=False)

    # Whether this method is currently active
    # Inactive methods can't be used for new syntheses but remain
    # in the system for historical reference
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
    # Relationships
    # =========================================================================

    # Many-to-many: Chemicals used in this method
    chemicals = relationship(
        "Chemical",
        secondary=chemical_method,
        back_populates="methods",
        doc="Chemical compounds used in this synthesis method"
    )

    # One-to-many: Catalysts created using this method
    catalysts = relationship(
        "Catalyst",
        back_populates="method",
        doc="Catalysts synthesized using this method"
    )

    # One-to-many: Samples prepared using this method (Phase 2)
    samples = relationship(
        "Sample",
        back_populates="method",
        doc="Samples prepared using this method"
    )

    # One-to-many: Modification history (Phase 5)
    # Using the UserMethod association model for rich audit data
    user_changes = relationship(
        "UserMethod",
        back_populates="method",
        cascade="all, delete-orphan",
        doc="History of modifications to this method"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Method(id={self.id}, name='{self.descriptive_name}', active={self.is_active})>"

    @property
    def chemical_count(self) -> int:
        """Number of chemicals used in this method."""
        return len(self.chemicals) if self.chemicals else 0

    @property
    def catalyst_count(self) -> int:
        """Number of catalysts created with this method."""
        return len(self.catalysts) if self.catalysts else 0

    @property
    def sample_count(self) -> int:
        """Number of samples prepared with this method."""
        return len(self.samples) if self.samples else 0

    @property
    def is_in_use(self) -> bool:
        """Check if this method is used by any catalysts or samples."""
        return self.catalyst_count > 0 or self.sample_count > 0

    @property
    def modification_count(self) -> int:
        """Number of recorded modifications to this method."""
        return len(self.user_changes) if self.user_changes else 0
