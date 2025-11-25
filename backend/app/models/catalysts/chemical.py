"""
Chemical model representing chemical compounds used in research.

Chemicals are the reagents, solvents, catalysts, and other compounds used
in synthesis methods. This model tracks which chemicals exist in the lab
and how they're used across different methods.

The model is intentionally simple, containing just identification and
timestamps. Additional information like CAS numbers, safety data, or
inventory quantities could be added in future enhancements.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Chemical(Base):
    """
    Chemical model for tracking chemical compounds.
    
    Chemicals are referenced by methods to document what compounds are
    used in each synthesis procedure. The same chemical might be used
    in many different methods, which is why this is a separate entity
    rather than just a field on methods.
    
    The unique constraint on name ensures each chemical is only listed
    once in the database, preventing duplicates from slight variations
    in spelling or formatting.
    """

    __tablename__ = "chemicals"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Name of the chemical compound
    # Examples: "Titanium(IV) isopropoxide", "Ethanol", "Ammonia solution"
    # The unique constraint prevents duplicate entries
    name = Column(String(50), unique=True, nullable=False)

    # Timestamp tracking when this chemical was first added to the database
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to the chemical record
    # Updated automatically by the database trigger
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships

    # Many-to-many relationship to methods that use this chemical
    # This is the inverse of the relationship defined in the Method model
    # The secondary parameter references the same junction table
    # back_populates connects this to method.chemicals
    #
    # When you access chemical.methods, you get a list of all methods
    # that use this chemical, which is useful for questions like
    # "what synthesis procedures use titanium isopropoxide?"
    methods = relationship(
        "Method",
        secondary="chemical_method",
        back_populates="chemicals"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Chemical(id={self.id}, name='{self.name}')>"

    @property
    def usage_count(self):
        """
        Property that returns how many methods use this chemical.
        
        This is a convenience property that counts the methods relationship.
        It's useful for UI features like showing which chemicals are most
        commonly used, or for validation (warning before deleting a
        widely-used chemical).
        
        Note: This property triggers a database query when accessed if the
        methods relationship isn't already loaded. For bulk operations,
        it's more efficient to use a join query with a count.
        """
        return len(self.methods)