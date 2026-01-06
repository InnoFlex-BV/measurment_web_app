"""
Reactor model representing experimental reactor equipment.

Reactors are the vessels where catalytic reactions and plasma experiments
are conducted. Each reactor has specific characteristics that affect
experimental results.

Database Schema (from 01_init.sql):
-----------------------------------
create table reactor (
     id serial primary key,
     description text,
     volume numeric(10,4),
     updated_at timestamp with time zone default current_timestamp not null,
     created_at timestamp with time zone default current_timestamp not null
);

Design Notes:
-------------
- Simple model with description and volume
- Referenced by Experiments via reactor_id (ON DELETE RESTRICT)
- Table name is singular "reactor" (matching SQL schema)
"""

from sqlalchemy import Column, Integer, Text, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Reactor(Base):
    """
    Reactor model for experimental equipment.
    
    Reactors are the physical vessels where experiments are conducted.
    Key characteristics include:
    - Volume: Affects residence time and conversion calculations
    - Description: Detailed notes about reactor design and configuration
    
    Common reactor types in catalysis research:
    - Fixed-bed reactors: Catalyst packed in a tube
    - Fluidized-bed reactors: Catalyst suspended in gas flow
    - Batch reactors: Closed vessel for batch processing
    - DBD reactors: Dielectric barrier discharge for plasma catalysis
    - Photoreactors: For photocatalytic experiments
    
    The ON DELETE RESTRICT constraint on experiments means a reactor
    cannot be deleted if it's referenced by any experiments. This
    ensures experimental data maintains its equipment context.
    """

    __tablename__ = "reactor"  # Note: singular to match database schema

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Reactor name/identifier
    name = Column(Text, nullable=False)

    # Detailed description of the reactor
    # Include: design type, materials, dimensions, configuration details
    # Example: "Quartz DBD reactor, 10mm gap, powered electrode 50mm diameter,
    #          mesh ground electrode, gas inlet/outlet on sides"
    description = Column(Text, nullable=True)

    # Reactor volume in appropriate units (typically mL or L)
    # Important for calculating GHSV, residence time, etc.
    volume = Column(Numeric(10, 4), nullable=True)

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

    # One-to-many: Experiments conducted in this reactor
    experiments = relationship(
        "Experiment",
        back_populates="reactor",
        doc="Experiments conducted using this reactor"
    )

    def __repr__(self):
        """String representation for debugging."""
        desc_preview = self.description[:30] + "..." if self.description and len(self.description) > 30 else self.description
        return f"<Reactor(id={self.id}, volume={self.volume}, desc='{desc_preview}')>"

    @property
    def experiment_count(self) -> int:
        """Number of experiments using this reactor."""
        return len(self.experiments) if self.experiments else 0

    @property
    def is_in_use(self) -> bool:
        """Check if this reactor is referenced by any experiments."""
        return self.experiment_count > 0

    @property
    def volume_display(self) -> str:
        """Human-readable volume with units."""
        if self.volume is None:
            return "Not specified"
        vol = float(self.volume)
        if vol >= 1000:
            return f"{vol / 1000:.2f} L"
        return f"{vol:.2f} mL"