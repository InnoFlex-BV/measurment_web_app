"""
Carrier model representing carrier/balance gases.

Carriers are the gases used as the main flow in experiments, carrying
the contaminants through the reactor. They're linked to experiments
through the carrier_experiment junction table which also stores the ratio.

Database Schema (from 01_init.sql):
-----------------------------------
create table carriers (
    id serial primary key,
    name varchar(255) not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table carrier_experiment (
    carrier_id integer not null references carriers(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    ratio numeric(10,4),
    primary key(carrier_id, experiment_id)
);

Design Notes:
-------------
- Simple lookup table with just name and timestamps
- Junction table stores ratio (fraction or percentage) for each experiment
- Common carriers: N2, Ar, He, air, O2
- Multiple carriers can be used in one experiment with different ratios
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for carrier-experiment relationship
# Includes ratio column for gas composition
carrier_experiment = Table(
    'carrier_experiment',
    Base.metadata,
    Column('carrier_id', Integer, ForeignKey('carriers.id', ondelete='CASCADE'), primary_key=True),
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True),
    Column('ratio', Numeric(10, 4), nullable=True)
)


class Carrier(Base):
    """
    Carrier model for carrier/balance gases.
    
    Carriers are the bulk gases that make up the experimental gas
    mixture. The contaminant(s) are diluted in the carrier gas and
    flow through the reactor.
    
    Common carrier gases:
    - N2 (nitrogen): Inert, most common
    - Ar (argon): Inert, used when N2 reactivity is a concern
    - He (helium): Inert, good for plasma (lower breakdown voltage)
    - Air: Mixture of N2 and O2, simulates real conditions
    - O2 (oxygen): When oxidation is desired
    
    Gas Mixtures:
    When multiple carriers are used, the ratio field in the junction
    table stores each gas's fraction. Ratios should typically sum
    to 1.0 (or 100% if stored as percentages).
    
    Example: 80% N2, 20% O2 would have:
    - N2 carrier with ratio 0.8
    - O2 carrier with ratio 0.2
    """

    __tablename__ = "carriers"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Carrier gas name
    # Use standard chemical symbols or names
    # Examples: "N2", "Ar", "He", "Air", "O2"
    name = Column(String(255), nullable=False)

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

    # Many-to-many: Experiments using this carrier gas
    # The ratio value is stored in the junction table
    experiments = relationship(
        "Experiment",
        secondary=carrier_experiment,
        back_populates="carriers",
        doc="Experiments using this carrier gas"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Carrier(id={self.id}, name='{self.name}')>"

    @property
    def experiment_count(self) -> int:
        """Number of experiments using this carrier."""
        return len(self.experiments) if self.experiments else 0

    @property
    def is_in_use(self) -> bool:
        """Check if any experiments use this carrier."""
        return self.experiment_count > 0