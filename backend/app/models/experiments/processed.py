"""
Processed model representing processed experiment results.

Processed records store calculated/derived results from experiments,
particularly performance metrics like DRE (Decomposition/Removal Efficiency)
and EY (Energy Yield).

Database Schema (from 01_init.sql):
-----------------------------------
create table processed (
    id serial primary key,
    dre numeric(10,4),
    ey numeric(10,4)
);

Design Notes:
-------------
- Very simple table with just two metrics
- No timestamps - these are calculated results, not tracked entities
- Referenced by Experiments via processed_table_id
- Experiments also have a processed_data JSONB field for flexible data
"""

from sqlalchemy import Column, Integer, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class Processed(Base):
    """
    Processed model for experiment performance metrics.
    
    This model stores key calculated results from experiments:
    
    DRE (Decomposition/Removal Efficiency):
    - Percentage of target compound removed/converted
    - Calculated as: (C_in - C_out) / C_in × 100%
    - Higher is better (more conversion)
    
    EY (Energy Yield):
    - Amount of compound removed per unit energy
    - Units typically: g/kWh or mol/kWh
    - Higher is better (more efficient)
    
    These metrics are commonly used to compare catalyst and reactor
    performance across different experimental conditions.
    
    Note: Experiments also have a processed_data JSONB field for
    storing additional calculated values not captured here.
    """

    __tablename__ = "processed"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Decomposition/Removal Efficiency
    # Typically a percentage (0-100) but could exceed 100% in some calculations
    # or be negative for production reactions
    dre = Column(Numeric(10, 4), nullable=True)

    # Energy Yield
    # Amount of conversion per unit energy input
    # Units depend on the specific calculation method
    ey = Column(Numeric(10, 4), nullable=True)

    # Note: No timestamps in this table per database schema

    # =========================================================================
    # Relationships
    # =========================================================================

    # One-to-many: Experiments with these processed results
    # An experiment references this via processed_table_id
    experiments = relationship(
        "Experiment",
        back_populates="processed_results",
        doc="Experiments with these processed results"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Processed(id={self.id}, dre={self.dre}, ey={self.ey})>"

    @property
    def has_dre(self) -> bool:
        """Check if DRE value is recorded."""
        return self.dre is not None

    @property
    def has_ey(self) -> bool:
        """Check if EY value is recorded."""
        return self.ey is not None

    @property
    def is_complete(self) -> bool:
        """Check if both metrics are recorded."""
        return self.has_dre and self.has_ey