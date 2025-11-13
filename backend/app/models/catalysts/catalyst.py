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


class Catalyst(Base):
    """
    Catalyst model representing synthesized catalyst materials.
    
    Each catalyst record represents a specific batch or quantity of catalyst
    material that was created at a particular time using a particular method.
    The catalog tracks both the synthesis details and the physical inventory
    (how much remains, where it's stored).
    
    Catalysts are typically named with identifiers like "CAT-001" or given
    descriptive names like "TiO2-Pt-500C" that encode information about
    composition and synthesis conditions.
    """

    __tablename__ = "catalysts"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Name or identifier for this catalyst
    # Could be a catalog number ("CAT-047"), descriptive name
    # ("Platinum-doped Titania"), or combination
    # Not necessarily unique because researchers might use similar naming
    # for related catalysts, relying on IDs for uniqueness
    name = Column(String(255), nullable=False)

    # Foreign key to the method used to create this catalyst
    # This records how the catalyst was synthesized
    # ON DELETE SET NULL means if the method is deleted, the catalyst
    # remains but loses the method reference (preserves data integrity)
    method_id = Column(
        Integer,
        ForeignKey('methods.id', ondelete='SET NULL'),
        nullable=True,  # Nullable in case method is deleted or wasn't recorded
        index=True
    )

    # Yield from synthesis as a mass or quantity
    # Recorded as a numeric with 4 decimal places for precision
    # Example: 15.7523 grams
    # The check constraint ensures yield is never negative
    yield_amount = Column(
        'yield',
        Numeric(8, 4),
        CheckConstraint('yield >= 0', name='check_catalyst_yield_positive'),
        nullable=False
    )

    # Current remaining amount of this catalyst in storage
    # Decreases as material is used in samples or experiments
    # Also has a check constraint for non-negative values
    # Should never exceed the original yield unless additional synthesis occurred
    remaining_amount = Column(
        Numeric(8, 4),
        CheckConstraint('remaining_amount >= 0', name='check_catalyst_remaining_positive'),
        nullable=False
    )

    # Physical storage location of this catalyst
    # Examples: "Freezer A, Shelf 2, Box 3", "Desiccator Cabinet, Section B",
    #           "Fume Hood 4, Left Side"
    # Important for retrieving the material for use or characterization
    storage_location = Column(String(255), nullable=False)

    # Free-form notes about this catalyst
    # Can include observations during synthesis, unusual properties,
    # handling requirements, or any other relevant information
    notes = Column(Text, nullable=True)

    # Timestamp tracking when this catalyst was synthesized/created
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to the catalyst record
    # Updated automatically by the database trigger
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships

    # Many-to-one relationship to the method used to create this catalyst
    # catalyst.method gives you the Method object with full procedure details
    method = relationship(
        "Method",
        back_populates="catalysts"
    )

    # Self-referential many-to-many relationship for catalyst derivation
    # Catalysts can be created from other catalysts through modification
    #
    # input_catalysts: catalysts that were used as inputs to create this one
    # output_catalysts: catalysts that were created using this one as input
    #
    # Example: If Catalyst B was created by calcining Catalyst A:
    # - A.output_catalysts includes B
    # - B.input_catalysts includes A
    #
    # primaryjoin and secondaryjoin tell SQLAlchemy how to navigate the
    # self-referential relationship through the junction table
    input_catalysts = relationship(
        "Catalyst",
        secondary=catalyst_catalyst,
        primaryjoin=(id == catalyst_catalyst.c.output_catalyst_id),
        secondaryjoin=(id == catalyst_catalyst.c.input_catalyst_id),
        backref="output_catalysts"
    )

    # Many-to-many relationship to characterizations performed on this catalyst
    # A catalyst can have multiple characterizations (XRD, BET, TEM, etc.)
    # and a single characterization record might analyze multiple catalysts
    # (though this is less common in practice)
    # TODO: uncomment in the future
    # characterizations = relationship(
    #     "Characterization",
    #     secondary=catalyst_characterization,
    #     back_populates="catalysts"
    # )

    # Many-to-many relationship to observations about this catalyst
    # Observations might record synthesis notes, appearance, handling issues,
    # or unexpected behaviors
    # TODO: uncomment in the future
    # observations = relationship(
    #     "Observation",
    #     secondary=catalyst_observation,
    #     back_populates="catalysts"
    # )

    # One-to-many relationship to samples created from this catalyst
    # Samples represent the catalyst applied to a support or prepared
    # for testing in a specific way
    # We'll define this when we create the Sample model in Phase 2
    # TODO: uncomment once implemented
    # samples = relationship(
    #     "Sample",
    #     back_populates="catalyst"
    # )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Catalyst(id={self.id}, name='{self.name}', remaining={self.remaining_amount})>"

    @property
    def is_depleted(self):
        """
        Property indicating whether this catalyst is fully consumed.
        
        Returns True if remaining_amount is zero or very close to zero
        (within floating point tolerance).
        """
        return self.remaining_amount <= 0.0001

    @property
    def usage_percentage(self):
        """
        Property calculating what percentage of the original yield has been used.
        
        Returns a value between 0 and 100 representing the percentage consumed.
        Returns 0 if yield is 0 to avoid division by zero.
        """
        if self.yield_amount == 0:
            return 0
        used_amount = self.yield_amount - self.remaining_amount
        return (used_amount / self.yield_amount) * 100