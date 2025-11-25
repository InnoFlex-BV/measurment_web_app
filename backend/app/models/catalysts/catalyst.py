"""
Catalyst model representing synthesized catalyst materials.

Catalysts are the core research artifacts in this system. A catalyst represents
a specific catalyst material that was synthesized using a particular method.
Catalysts are characterized to understand their properties, tested in experiments
to evaluate their performance, and tracked through their lifecycle from synthesis
to storage.

Catalysts can be derived from other catalysts (represented through the
catalyst_catalyst relationship), creating chains of modification and optimization.
For example, a catalyst might be calcined to create a new catalyst, or doped
with additional elements to create a variant.

Phase 2 Additions:
- samples relationship: Track samples prepared from this catalyst
- characterizations relationship: Link to analytical characterizations
- observations relationship: Link to qualitative observations
"""

from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Table, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for catalyst derivation relationships
# This table tracks when one catalyst is created from another catalyst
# The relationship is directional: input_catalyst → output_catalyst
#
# Example: Catalyst A is calcined to create Catalyst B
# - input_catalyst_id = A.id
# - output_catalyst_id = B.id
#
# This creates a directed graph of catalyst relationships showing how
# catalysts evolve through modifications and improvements
catalyst_catalyst = Table(
    'catalyst_catalyst',
    Base.metadata,
    Column('input_catalyst_id', Integer, ForeignKey('catalysts.id', ondelete='CASCADE'), primary_key=True),
    Column('output_catalyst_id', Integer, ForeignKey('catalysts.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for many-to-many relationship between catalysts and characterizations
# Characterizations analyze catalyst properties, and both catalysts and samples
# can be characterized. A single characterization technique (like XRD) might
# be performed multiple times on the same catalyst under different conditions,
# creating multiple characterization records.
catalyst_characterization = Table(
    'catalyst_characterization',
    Base.metadata,
    Column('catalyst_id', Integer, ForeignKey('catalysts.id', ondelete='CASCADE'), primary_key=True),
    Column('characterization_id', Integer, ForeignKey('characterizations.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for catalysts and observations
# Observations record qualitative notes during catalyst synthesis, testing,
# or handling. Multiple observations can be made about a single catalyst,
# and a single observation might pertain to multiple catalysts (though this
# is less common).
catalyst_observation = Table(
    'catalyst_observation',
    Base.metadata,
    Column('catalyst_id', Integer, ForeignKey('catalysts.id', ondelete='CASCADE'), primary_key=True),
    Column('observation_id', Integer, ForeignKey('observations.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for user-catalyst audit tracking
# Records which users have worked on each catalyst
user_catalyst = Table(
    'user_catalyst',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('catalyst_id', Integer, ForeignKey('catalysts.id', ondelete='CASCADE'), primary_key=True),
    Column('changed_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)


class Catalyst(Base):
    """
    Catalyst model representing synthesized catalyst materials.
    
    Catalysts are the central entities in this research data management system.
    They connect to:
    - Methods (how they were made)
    - Other catalysts (derivation chains)
    - Samples (portions prepared for testing)
    - Characterizations (analytical measurements)
    - Observations (qualitative notes)
    - Experiments (performance testing) [Phase 3]
    - Users (audit tracking)
    """

    __tablename__ = "catalysts"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Catalyst name/identifier
    # Should be descriptive and unique within a research group
    # Examples: "Pt-TiO2-5wt%", "Au/CeO2-calcined-500C", "Pd-ZnO-imp-reduced"
    name = Column(String(255), nullable=False)

    # Foreign key to the method used to synthesize this catalyst
    # Methods document the synthesis procedure and chemicals used
    method_id = Column(
        Integer,
        ForeignKey('methods.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )

    # Amount of catalyst material produced (in grams typically)
    # This is the original yield from synthesis, stored for reference
    # Check constraint ensures non-negative values
    yield_amount = Column(
        'yield',  # Column name in database is 'yield'
        Numeric(8, 4),
        CheckConstraint('yield >= 0', name='check_catalyst_yield_positive'),
        nullable=False
    )

    # Amount of catalyst material remaining
    # Decreases as material is used in samples or directly in experiments
    remaining_amount = Column(
        Numeric(8, 4),
        CheckConstraint('remaining_amount >= 0', name='check_catalyst_remaining_positive'),
        nullable=False
    )

    # Physical storage location
    # Examples: "Freezer A, Shelf 2", "Desiccator Cabinet B", "Glovebox 1"
    storage_location = Column(String(255), nullable=False)

    # Free-form notes about this catalyst
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

    # Many-to-one: Catalyst created using a Method
    method = relationship(
        "Method",
        back_populates="catalysts",
        doc="Synthesis method used to create this catalyst"
    )

    # Self-referential many-to-many for catalyst derivation chains
    # input_catalysts: catalysts used to create this one
    # output_catalysts: catalysts created from this one
    input_catalysts = relationship(
        "Catalyst",
        secondary=catalyst_catalyst,
        primaryjoin=(id == catalyst_catalyst.c.output_catalyst_id),
        secondaryjoin=(id == catalyst_catalyst.c.input_catalyst_id),
        backref="output_catalysts",
        doc="Catalysts that were used as inputs to create this catalyst"
    )

    # One-to-many: Samples prepared from this catalyst (Phase 2)
    samples = relationship(
        "Sample",
        back_populates="catalyst",
        cascade="all, delete-orphan",
        doc="Samples prepared from this catalyst"
    )

    # Many-to-many: Characterizations of this catalyst (Phase 2)
    characterizations = relationship(
        "Characterization",
        secondary=catalyst_characterization,
        back_populates="catalysts",
        doc="Analytical characterizations performed on this catalyst"
    )

    # Many-to-many: Observations about this catalyst (Phase 2)
    observations = relationship(
        "Observation",
        secondary=catalyst_observation,
        back_populates="catalysts",
        doc="Qualitative observations about this catalyst"
    )

    # Many-to-many: Users who worked on this catalyst (Phase 5)
    users = relationship(
        "User",
        secondary=user_catalyst,
        back_populates="catalysts",
        doc="Users who have worked on this catalyst"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Catalyst(id={self.id}, name='{self.name}', remaining={self.remaining_amount})>"

    @property
    def is_depleted(self) -> bool:
        """Check if this catalyst is fully consumed."""
        return self.remaining_amount <= 0.0001

    @property
    def usage_percentage(self) -> float:
        """Calculate percentage of original yield that has been used."""
        if self.yield_amount == 0:
            return 0.0
        used = float(self.yield_amount) - float(self.remaining_amount)
        return (used / float(self.yield_amount)) * 100

    @property
    def sample_count(self) -> int:
        """Number of samples prepared from this catalyst."""
        return len(self.samples) if self.samples else 0

    @property
    def characterization_count(self) -> int:
        """Number of characterizations performed on this catalyst."""
        return len(self.characterizations) if self.characterizations else 0
