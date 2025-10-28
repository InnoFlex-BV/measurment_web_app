"""
Experiment model representing laboratory experiments.

This is the central entity that ties together all experiment data including
metadata, measurements, observations, and attached files.
"""

from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Experiment(Base):
    """
    Experiment model storing metadata about laboratory experiments.
    
    Each experiment has a type, is conducted by a user, and has environmental
    conditions. Experiments can have multiple measurements, observations, and files.
    """

    __tablename__ = "experiments"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to experiment_types table
    # ForeignKey creates the database constraint
    # nullable=False means every experiment must have a type
    experiment_type_id = Column(
        Integer,
        ForeignKey('experiment_types.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # Foreign key to users table indicating who conducted the experiment
    user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # Short descriptive title
    title = Column(String(200), nullable=False)

    # Detailed description of purpose and methodology
    description = Column(Text, nullable=True)

    # When the experiment was actually performed
    # This is separate from created_at which is when it was logged
    experiment_date = Column(DateTime(timezone=True), nullable=False, index=True)

    # Environmental conditions during the experiment
    # These are important for reproducibility
    temperature_celsius = Column(Numeric(5, 2), nullable=True)
    pressure_atm = Column(Numeric(6, 3), nullable=True)
    humidity_percent = Column(Numeric(5, 2), nullable=True)

    # Additional conditions as JSON
    # JSONB is PostgreSQL's binary JSON type with indexing support
    # Allows flexible storage of varying conditions
    # Example: {"ph": 7.2, "lighting": "dark", "magnetic_field": 0.5}
    additional_conditions = Column(JSONB, nullable=True)

    # Current status of the experiment
    # Values: 'planned', 'in_progress', 'completed', 'failed', 'cancelled'
    status = Column(String(20), nullable=False, default='planned', index=True)

    # General notes or conclusions
    notes = Column(Text, nullable=True)

    # Audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships to related entities
    # These provide convenient navigation between related objects

    # Relationship to the experiment type
    # experiment.experiment_type gives you the ExperimentType object
    experiment_type = relationship("ExperimentType", back_populates="experiments")

    # Relationship to the user who conducted the experiment
    # experiment.user gives you the User object
    user = relationship("User", back_populates="experiments")

    # Relationship to measurements taken during this experiment
    # experiment.measurements gives you a list of all Measurement objects
    # cascade='all, delete-orphan' means deleting an experiment deletes its measurements
    measurements = relationship(
        "Measurement",
        back_populates="experiment",
        cascade="all, delete-orphan"
    )

    # Relationship to observations made during this experiment
    observations = relationship(
        "Observation",
        back_populates="experiment",
        cascade="all, delete-orphan"
    )

    # Relationship to files attached to this experiment
    files = relationship(
        "File",
        back_populates="experiment",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Experiment(id={self.id}, title='{self.title}', status='{self.status}')>"