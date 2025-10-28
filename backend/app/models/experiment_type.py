"""
ExperimentType model representing categories of experiments.

Experiment types provide a controlled vocabulary for categorizing experiments
like "Titration", "Spectroscopy", "Synthesis", etc.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ExperimentType(Base):
    """
    ExperimentType model for categorizing experiments.
    
    This is a lookup table that provides valid experiment categories.
    Using a separate table ensures consistency and makes it easy to add
    new types without schema changes.
    """

    __tablename__ = "experiment_types"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Name of the experiment type - must be unique
    # Examples: "Titration", "Spectroscopy", "Chromatography"
    name = Column(String(100), unique=True, nullable=False)

    # Detailed description of what this type means
    description = Column(String, nullable=True)

    # Whether this type is currently available for selection
    # Allows deprecating old types without breaking historical data
    is_active = Column(Boolean, default=True, nullable=False)

    # Creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship to experiments of this type
    # When you query experiment_type.experiments, you get all experiments with this type
    experiments = relationship("Experiment", back_populates="experiment_type")

    def __repr__(self):
        return f"<ExperimentType(id={self.id}, name='{self.name}')>"