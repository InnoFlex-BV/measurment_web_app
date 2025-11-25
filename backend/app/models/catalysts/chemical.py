"""
Chemical model representing chemical compounds used in catalyst synthesis.

Chemicals are the raw materials and reagents used in synthesis methods.
Each chemical record represents a specific compound. Chemicals are linked
to methods through a many-to-many relationship, allowing the same chemical
to be used in multiple synthesis procedures.

Database Schema (from 01_init.sql):
----------------------------------
create table chemicals (
    id serial primary key,
    name varchar(50) not null unique,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

Design Notes:
------------
- Chemical names must be unique to prevent duplicates
- Name is limited to 50 characters per database schema
- The model is intentionally simple - additional metadata like CAS numbers,
  formulas, or safety data could be added via schema migration if needed
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Import the junction table from method.py
from app.models.catalysts.method import chemical_method


class Chemical(Base):
    """
    Chemical model for tracking reagents and compounds.
    
    Chemicals represent the materials used in catalyst synthesis.
    They connect to methods through the chemical_method junction table,
    documenting which chemicals are needed for each synthesis procedure.
    
    Naming Conventions:
    - Use common names for well-known compounds (e.g., "Sodium Hydroxide")
    - Include concentration/purity when relevant (e.g., "Ethanol 99.5%")
    - Use IUPAC names for complex or unusual compounds
    - Include supplier/grade for critical reagents
    
    Examples:
    - "Chloroplatinic Acid (H2PtCl6·6H2O)"
    - "Tetraethyl Orthosilicate (TEOS) 98%"
    - "Titanium(IV) Isopropoxide"
    - "Cerium(III) Nitrate Hexahydrate"
    """

    __tablename__ = "chemicals"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Chemical name - must be unique
    # Limited to 50 characters per database schema
    # Should be descriptive and standardized within the research group
    name = Column(String(50), unique=True, nullable=False, index=True)

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

    # Many-to-many: Methods that use this chemical
    methods = relationship(
        "Method",
        secondary=chemical_method,
        back_populates="chemicals",
        doc="Synthesis methods that use this chemical"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Chemical(id={self.id}, name='{self.name}')>"

    @property
    def method_count(self) -> int:
        """Number of methods that use this chemical."""
        return len(self.methods) if self.methods else 0

    @property
    def is_in_use(self) -> bool:
        """Check if any methods reference this chemical."""
        return self.method_count > 0
