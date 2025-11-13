"""
Support model representing substrate materials for catalysts.

In catalyst research, a support is a material that provides a substrate
for the active catalyst. Common supports include materials like alumina,
silica, activated carbon, or zeolites. The support can affect the catalyst's
surface area, dispersion, stability, and activity.

Catalysts can be used with or without supports. When a catalyst is applied
to a support, it creates a "sample" which is a distinct entity representing
that specific combination.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Support(Base):
    """
    Support model for tracking substrate materials.
    
    Supports are referenced by samples when a catalyst is applied to or
    combined with a support material. The same support can be used with
    many different catalysts, creating different samples.
    
    The descriptive_name is unique because supports are typically referred
    to by their material type and specifications. For example, "Alumina γ-Al₂O₃",
    "Silica SiO₂ 200m²/g", or "Activated Carbon AC-400".
    """

    __tablename__ = "supports"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descriptive name identifying this support material
    # Should include material type and relevant specifications
    # Examples: "γ-Alumina (200 m²/g)", "MCM-41 Mesoporous Silica",
    #           "TiO₂ Anatase P25", "Graphene Oxide"
    # Unique constraint ensures each support type is only entered once
    descriptive_name = Column(String(255), unique=True, nullable=False)

    # Detailed description of the support material
    # Can include information about properties, source, specifications,
    # preparation method, or any other relevant details
    # Example: "High surface area alumina powder, γ-phase, surface area
    #          200 m²/g, obtained from Sigma-Aldrich catalog #12345"
    description = Column(Text, nullable=True)

    # Timestamp tracking when this support was first added to the database
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to the support record
    # Updated automatically by the database trigger
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships

    # One-to-many relationship to samples that use this support
    # A support can be used in many samples, but each sample uses
    # only one support (or none if it's an unsupported catalyst)
    #
    # We'll define the inverse relationship on the Sample model
    # TODO: uncomment once implemented
    # samples = relationship(
    #     "Sample",
    #     back_populates="support"
    # )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Support(id={self.id}, name='{self.descriptive_name}')>"