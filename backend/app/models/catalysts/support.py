"""
Support model representing substrate materials for catalysts.

In catalyst research, a support is a material that provides a substrate
for the active catalyst. Common supports include materials like alumina,
silica, activated carbon, or zeolites. The support can affect the catalyst's
surface area, dispersion, stability, and activity.

Catalysts can be used with or without supports. When a catalyst is applied
to a support, it creates a "sample" which is a distinct entity representing
that specific combination.

Phase 2 Addition:
- samples relationship: Track all samples that use this support material
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
    
    Common support materials in catalysis research:
    - Metal oxides: Al₂O₃, SiO₂, TiO₂, ZrO₂, CeO₂
    - Carbon materials: Activated carbon, graphene, carbon nanotubes
    - Zeolites: ZSM-5, Y-zeolite, Beta zeolite
    - Mesoporous materials: MCM-41, SBA-15
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

    # One-to-many: Samples that use this support (Phase 2)
    samples = relationship(
        "Sample",
        back_populates="support",
        doc="Samples prepared using this support material"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Support(id={self.id}, name='{self.descriptive_name}')>"

    @property
    def sample_count(self) -> int:
        """Number of samples using this support."""
        return len(self.samples) if self.samples else 0

    @property
    def is_in_use(self) -> bool:
        """Check if any samples reference this support."""
        return self.sample_count > 0
