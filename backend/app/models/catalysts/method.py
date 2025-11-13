"""
Method model representing catalyst synthesis procedures.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for the many-to-many relationship between methods and chemicals
# This table exists purely to connect methods with chemicals and has no
# attributes of its own beyond the two foreign keys.
# 
# We define this as a Table object (not a class) because it's a pure junction
# table with no additional attributes beyond the foreign keys. SQLAlchemy
# handles it automatically through the relationship definitions.
#
# The composite primary key (method_id, chemical_id) ensures each combination
# appears only once - you can't accidentally record the same chemical twice
# for the same method.
chemical_method = Table(
    'chemical_method',
    Base.metadata,
    Column('method_id', Integer, ForeignKey('methods.id', ondelete='CASCADE'), primary_key=True),
    Column('chemical_id', Integer, ForeignKey('chemicals.id', ondelete='CASCADE'), primary_key=True)
)


class Method(Base):
    """
    Method model representing catalyst synthesis procedures.
    
    Methods document how to create catalysts. The procedure field contains
    the detailed step-by-step instructions, while the relationship to
    chemicals captures which chemical compounds are involved.
    
    The is_active flag allows deprecating old methods without deleting them.
    Inactive methods can't be used for new catalysts, but historical catalysts
    that used those methods retain that information for reproducibility.
    """

    __tablename__ = "methods"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descriptive name that identifies this method
    # Examples: "Sol-Gel Synthesis", "Wet Impregnation", "Hydrothermal Method"
    # This should be unique enough to distinguish methods but doesn't have
    # a database uniqueness constraint to allow similar methods with variations
    descriptive_name = Column(String(255), nullable=False)

    # Detailed procedure text describing step-by-step instructions
    # This is the actual recipe that researchers follow
    # TEXT type allows procedures of any length with detailed instructions
    procedure = Column(Text, nullable=False)

    # Whether this method is currently available for use
    # Setting to False deprecates the method while preserving historical data
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamp tracking when the method was created
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to the method
    # Updated automatically by the database trigger
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships

    # Many-to-many relationship to chemicals used in this method
    # The secondary parameter tells SQLAlchemy to use the chemical_method
    # junction table to navigate between methods and chemicals
    # 
    # When you access method.chemicals, SQLAlchemy generates a query like:
    # SELECT chemicals.* FROM chemicals
    # JOIN chemical_method ON chemicals.id = chemical_method.chemical_id
    # WHERE chemical_method.method_id = ?
    #
    # The back_populates connects this to the corresponding relationship
    # on the Chemical model, creating a bidirectional connection
    chemicals = relationship(
        "Chemical",
        secondary=chemical_method,
        back_populates="methods"
    )

    # One-to-many relationship to catalysts created using this method
    # A method can be used to create many catalysts, but each catalyst
    # is created using one method (though it might reference other catalysts
    # as inputs through the catalyst_catalyst relationship)
    #
    # We'll define this relationship when we create the Catalyst model
    # because it references the Catalyst class which doesn't exist yet
    catalysts = relationship(
        "Catalyst",
        back_populates="method"
    )

    # Relationship to samples created using this method
    # Samples can also reference methods for their creation process
    # TODO: uncomment once implemented
    # samples = relationship(
    #     "Sample",
    #     back_populates="method"
    # )
    
    # TODO: add user_method relation in the future

    def __repr__(self):
        """String representation for debugging."""
        return f"<Method(id={self.id}, name='{self.descriptive_name}', active={self.is_active})>"