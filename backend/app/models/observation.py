"""
Observation model representing qualitative experimental notes.

Observations capture descriptive information like color changes,
precipitate formation, or unusual occurrences during experiments.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Observation(Base):
    """
    Observation model for qualitative experimental data.
    
    Observations capture things that don't fit into structured measurements,
    like visual changes, unexpected events, or researcher notes.
    """

    __tablename__ = "observations"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to experiments table
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # When during the experiment this observation was made
    # Allows reconstructing the timeline of events
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Category of observation for organization
    # Examples: "color_change", "precipitation", "gas_evolution"
    observation_type = Column(String(50), nullable=True)

    # The actual observation text - can be as detailed as needed
    observation_text = Column(Text, nullable=False)

    # Severity or importance level
    # Values: 'low', 'normal', 'high', 'critical'
    # Helps identify critical observations when reviewing data
    severity = Column(String(20), default='normal', nullable=False)

    # Creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship to the parent experiment
    experiment = relationship("Experiment", back_populates="observations")

    def __repr__(self):
        return f"<Observation(id={self.id}, type='{self.observation_type}', severity='{self.severity}')>"