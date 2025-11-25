"""
Sample model representing catalyst materials prepared for testing.

Samples are the bridge between catalyst synthesis and experimental testing.
A sample represents a catalyst that has been prepared in a specific way,
potentially applied to a support material, for use in experiments and
characterization studies.

The distinction between catalysts and samples is important:
- A Catalyst is the synthesized material itself (e.g., "Pt nanoparticles")
- A Sample is a prepared portion of catalyst, possibly on a support
  (e.g., "Pt nanoparticles on γ-Al₂O₃, 5wt%, batch #3")

This separation allows tracking:
- Multiple samples from the same catalyst batch
- Different support materials for the same catalyst
- Independent inventory tracking per sample
- Separate characterization and experiment histories

Relationships:
- Many-to-one with Catalyst (source material)
- Many-to-one with Support (substrate material, optional)
- Many-to-one with Method (preparation procedure, optional)
- Many-to-many with Characterization (analytical measurements)
- Many-to-many with Observation (qualitative notes)
- Many-to-many with Experiment (performance testing)
- Many-to-many with User (audit tracking via user_sample)
"""

from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Table, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for sample-characterization many-to-many relationship
# A sample can undergo multiple characterization techniques (XRD, BET, TEM, etc.)
# and a characterization record could potentially cover multiple samples
# (though single-sample characterizations are more common)
sample_characterization = Table(
    'sample_characterization',
    Base.metadata,
    Column('sample_id', Integer, ForeignKey('samples.id', ondelete='CASCADE'), primary_key=True),
    Column('characterization_id', Integer, ForeignKey('characterizations.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for sample-observation many-to-many relationship
# Observations record qualitative notes during sample preparation, handling,
# or testing. Multiple observations can relate to a single sample.
sample_observation = Table(
    'sample_observation',
    Base.metadata,
    Column('sample_id', Integer, ForeignKey('samples.id', ondelete='CASCADE'), primary_key=True),
    Column('observation_id', Integer, ForeignKey('observations.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for sample-experiment many-to-many relationship
# Experiments test sample performance under reaction conditions.
# An experiment might test multiple samples for comparison.
sample_experiment = Table(
    'sample_experiment',
    Base.metadata,
    Column('sample_id', Integer, ForeignKey('samples.id', ondelete='CASCADE'), primary_key=True),
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for user-sample audit tracking
# Records which users have worked on each sample and when.
# The changed_at timestamp tracks the most recent interaction.
user_sample = Table(
    'user_sample',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('sample_id', Integer, ForeignKey('samples.id', ondelete='CASCADE'), primary_key=True),
    Column('changed_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)


class Sample(Base):
    """
    Sample model representing prepared catalyst materials for testing.
    
    Samples track the lifecycle of catalyst materials from preparation
    through characterization and experimental testing. Each sample has
    its own inventory (yield, remaining_amount) separate from its source
    catalyst, allowing independent tracking of material consumption.
    
    The optional relationships to catalyst, support, and method provide
    flexibility:
    - A sample might be pure catalyst without support
    - A sample might be prepared without a formal method
    - A sample might be created from scratch rather than from an existing catalyst
    
    However, in typical usage, samples derive from catalysts and are
    prepared using documented methods.
    """

    __tablename__ = "samples"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Sample name/identifier
    # Should be descriptive and include relevant preparation details
    # Examples: "Pt/Al2O3-5wt%-batch3", "TiO2-P25-calcined-500C"
    name = Column(String(255), nullable=True)

    # Foreign key to the source catalyst
    # Nullable because samples could potentially be prepared from
    # materials not tracked as catalysts in this system
    catalyst_id = Column(
        Integer,
        ForeignKey('catalysts.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )

    # Foreign key to the support material
    # Nullable because not all samples use supports (unsupported catalysts)
    support_id = Column(
        Integer,
        ForeignKey('supports.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )

    # Foreign key to the preparation method
    # Nullable but recommended for reproducibility
    method_id = Column(
        Integer,
        ForeignKey('methods.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )

    # Amount of sample material produced (in grams typically)
    # Check constraint ensures non-negative values
    yield_amount = Column(
        'yield',  # Column name in database is 'yield' (reserved word in Python)
        Numeric(8, 4),
        CheckConstraint('yield >= 0', name='check_sample_yield_positive'),
        nullable=False
    )

    # Amount of sample material remaining
    # Decreases as material is used in experiments or characterizations
    remaining_amount = Column(
        Numeric(8, 4),
        CheckConstraint('remaining_amount >= 0', name='check_sample_remaining_positive'),
        nullable=False
    )

    # Physical storage location
    # Examples: "Desiccator A, Shelf 2", "Glovebox 1, Rack B3"
    storage_location = Column(String(255), nullable=False)

    # Free-form notes about this sample
    # Preparation details, handling requirements, observations, etc.
    notes = Column(Text, nullable=True)

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

    # Many-to-one: Sample belongs to a Catalyst
    catalyst = relationship(
        "Catalyst",
        back_populates="samples",
        doc="Source catalyst this sample was prepared from"
    )

    # Many-to-one: Sample uses a Support
    support = relationship(
        "Support",
        back_populates="samples",
        doc="Support material this catalyst is applied to"
    )

    # Many-to-one: Sample prepared using a Method
    method = relationship(
        "Method",
        back_populates="samples",
        doc="Method used to prepare this sample"
    )

    # Many-to-many: Sample has Characterizations
    characterizations = relationship(
        "Characterization",
        secondary=sample_characterization,
        back_populates="samples",
        doc="Characterization studies performed on this sample"
    )

    # Many-to-many: Sample has Observations
    observations = relationship(
        "Observation",
        secondary=sample_observation,
        back_populates="samples",
        doc="Qualitative observations about this sample"
    )

    # Many-to-many: Sample used in Experiments
    experiments = relationship(
        "Experiment",
        secondary=sample_experiment,
        back_populates="samples",
        doc="Experiments that tested this sample"
    )

    # Many-to-many: Users who worked on this sample
    # Using the user_sample junction table for audit tracking
    users = relationship(
        "User",
        secondary=user_sample,
        back_populates="samples",
        doc="Users who have worked on this sample"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Sample(id={self.id}, name='{self.name}', remaining={self.remaining_amount})>"

    @property
    def is_depleted(self) -> bool:
        """
        Check if this sample is fully consumed.
        
        Returns True if remaining_amount is zero or negligible.
        Uses a small tolerance to handle floating point precision.
        """
        return self.remaining_amount <= 0.0001

    @property
    def usage_percentage(self) -> float:
        """
        Calculate percentage of original material that has been used.
        
        Returns a value between 0 and 100.
        Returns 0 if yield is 0 to avoid division by zero.
        """
        if self.yield_amount == 0:
            return 0.0
        used = float(self.yield_amount) - float(self.remaining_amount)
        return (used / float(self.yield_amount)) * 100

    @property
    def has_support(self) -> bool:
        """Check if this sample uses a support material."""
        return self.support_id is not None

    @property
    def characterization_count(self) -> int:
        """Count of characterizations performed on this sample."""
        return len(self.characterizations) if self.characterizations else 0

    @property
    def experiment_count(self) -> int:
        """Count of experiments this sample has been used in."""
        return len(self.experiments) if self.experiments else 0
