"""
Contaminant model representing target pollutant compounds.

Contaminants are the target compounds that experiments aim to remove
or decompose. They're linked to experiments through the contaminant_experiment
junction table which also stores the concentration (ppm).

Database Schema (from 01_init.sql):
-----------------------------------
create table contaminants (
    id serial primary key,
    name varchar(255) not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table contaminant_experiment (
    contaminant_id integer not null references contaminants(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    ppm numeric(10,4),
    primary key(contaminant_id, experiment_id)
);

Design Notes:
-------------
- Simple lookup table with just name and timestamps
- Junction table stores ppm concentration for each experiment
- Common contaminants: VOCs, NOx, NH3, toluene, acetaldehyde, etc.
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for contaminant-experiment relationship
# Includes ppm column for concentration
contaminant_experiment = Table(
    'contaminant_experiment',
    Base.metadata,
    Column('contaminant_id', Integer, ForeignKey('contaminants.id', ondelete='CASCADE'), primary_key=True),
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True),
    Column('ppm', Numeric(10, 4), nullable=True)
)


class Contaminant(Base):
    """
    Contaminant model for target pollutant compounds.
    
    Contaminants represent the molecules that experiments aim to
    remove, decompose, or convert. Typical contaminants in plasma
    catalysis and photocatalysis research include:
    
    Volatile Organic Compounds (VOCs):
    - Toluene, benzene, xylene
    - Formaldehyde, acetaldehyde
    - Acetone, ethanol
    
    Nitrogen Compounds:
    - NOx (NO, NO2)
    - NH3 (ammonia)
    - N2O (nitrous oxide)
    
    Other:
    - CO (carbon monoxide)
    - SO2 (sulfur dioxide)
    - O3 (ozone)
    
    The ppm concentration for each experiment is stored in the
    contaminant_experiment junction table, not in this model.
    """

    __tablename__ = "contaminants"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Contaminant name
    # Use standard chemical names for consistency
    # Examples: "Toluene", "Acetaldehyde", "NOx", "NH3"
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

    # Many-to-many: Experiments targeting this contaminant
    # The ppm value is stored in the junction table
    experiments = relationship(
        "Experiment",
        secondary=contaminant_experiment,
        back_populates="contaminants",
        doc="Experiments targeting this contaminant"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Contaminant(id={self.id}, name='{self.name}')>"

    @property
    def experiment_count(self) -> int:
        """Number of experiments targeting this contaminant."""
        return len(self.experiments) if self.experiments else 0

    @property
    def is_in_use(self) -> bool:
        """Check if any experiments target this contaminant."""
        return self.experiment_count > 0