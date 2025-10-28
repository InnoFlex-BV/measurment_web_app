"""
Measurement model representing quantitative experimental results.

Measurements store numerical values with units and optional uncertainty.
"""

from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Measurement(Base):
    """
    Measurement model for quantitative experimental data.
    
    Each measurement has a name (what was measured), a numeric value,
    a unit, and optionally an uncertainty. Measurements belong to experiments.
    """

    __tablename__ = "measurements"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to experiments table
    # ON DELETE CASCADE means deleting an experiment deletes its measurements
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Descriptive name of what was measured
    # Examples: "Initial pH", "Final mass", "Absorption at 500nm"
    measurement_name = Column(String(100), nullable=False, index=True)

    # The actual measured value
    # NUMERIC provides exact decimal arithmetic without float rounding errors
    measurement_value = Column(Numeric, nullable=False)

    # Unit of measurement - critical for interpreting the value
    # Examples: "mL", "g", "mol/L", "°C", "nm"
    unit = Column(String(50), nullable=False)

    # Measurement uncertainty if tracked
    # Allows storing error bars or confidence intervals
    uncertainty = Column(Numeric, nullable=True)

    # When this measurement was taken
    # Useful for experiments with measurements at different times
    measured_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Additional metadata as JSON
    # Could include instrument used, calibration info, environmental conditions
    # Example: {"instrument": "pH meter model X", "calibrated": "2024-01-15"}
    measurement_metadata = Column(JSONB, nullable=True)

    # Creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship to the parent experiment
    # measurement.experiment gives you the Experiment object
    experiment = relationship("Experiment", back_populates="measurements")

    def __repr__(self):
        return (f"<Measurement(id={self.id}, name='{self.measurement_name}', "
                f"value={self.measurement_value} {self.unit})>")