"""
Observation model representing qualitative and structured research notes.

Observations capture detailed records of research processes that don't fit
neatly into the structured experiment or characterization workflows. They're
particularly useful for documenting:

- Catalyst synthesis conditions and visual observations
- Calcination and heat treatment parameters
- Unexpected behaviors or anomalies
- Process optimization notes
- Preliminary results before formal characterization

Unlike Experiments (which test performance) or Characterizations (which measure
properties), Observations provide a flexible format for recording process
details using a combination of structured JSON fields and free-form text.

The JSONB fields allow storing arbitrary structured data:
- conditions: Environmental and process conditions during the observation
- calcination_parameters: Heat treatment settings if applicable
- data: Any numerical or structured data collected

This flexibility is intentional - research observations vary widely in content
and structure. The JSONB approach allows capturing diverse information without
requiring schema changes for each new type of observation.

Relationships:
- Many-to-many with Catalyst (observations about catalysts)
- Many-to-many with Sample (observations about samples)
- Many-to-many with File (supporting documentation, images, data files)
- Many-to-many with User (who made the observation)
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Import junction tables from related models
from app.models.catalysts.catalyst import catalyst_observation
from app.models.catalysts.sample import sample_observation


# Junction table for observation-file many-to-many relationship
# Observations can have multiple attached files (images, data, documents)
observation_file = Table(
    'observation_file',
    Base.metadata,
    Column('observation_id', Integer, ForeignKey('observations.id', ondelete='CASCADE'), primary_key=True),
    Column('file_id', Integer, ForeignKey('files.id', ondelete='CASCADE'), primary_key=True)
)


# Junction table for user-observation audit tracking
# Records which users contributed to each observation
user_observation = Table(
    'user_observation',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('observation_id', Integer, ForeignKey('observations.id', ondelete='CASCADE'), primary_key=True),
    Column('changed_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)


class Observation(Base):
    """
    Observation model for research notes and process documentation.
    
    Observations provide a semi-structured way to record research activities
    that don't fit the formal experiment or characterization workflows.
    They're especially valuable for:
    
    1. Synthesis Documentation:
       - Visual changes during reaction (color, precipitation, gas evolution)
       - Temperature and time profiles
       - Deviations from standard procedures
    
    2. Calcination Records:
       - Heating rate, hold temperature, hold time
       - Atmosphere (air, N2, H2, etc.)
       - Observed changes during heat treatment
    
    3. Process Optimization:
       - What worked, what didn't
       - Parameter adjustments and their effects
       - Ideas for future experiments
    
    The JSONB fields provide flexibility for different observation types:
    
    Example conditions JSON:
    {
        "temperature": 80,
        "temperature_unit": "°C",
        "atmosphere": "N2",
        "pressure": 1.0,
        "pressure_unit": "atm",
        "stirring_rate": 500,
        "stirring_unit": "rpm",
        "duration": 2,
        "duration_unit": "hours"
    }
    
    Example calcination_parameters JSON:
    {
        "ramp_rate": 5,
        "ramp_unit": "°C/min",
        "target_temperature": 500,
        "hold_time": 4,
        "hold_unit": "hours",
        "atmosphere": "air",
        "cooling": "natural"
    }
    
    Example data JSON:
    {
        "mass_before": 2.5,
        "mass_after": 2.1,
        "mass_loss_percent": 16,
        "color_before": "white",
        "color_after": "pale yellow",
        "yield_estimate": 85
    }
    """

    __tablename__ = "observations"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Objective of this observation
    # What were you trying to learn or document?
    # Examples: "Monitor color change during synthesis",
    #           "Document calcination of TiO2 precursor",
    #           "Record unexpected precipitation event"
    objective = Column(String(255), nullable=False)

    # Conditions during the observation (JSONB for flexibility)
    # Store any relevant environmental or process conditions
    # Schema varies based on observation type
    conditions = Column(JSONB, nullable=False, default=dict)

    # Calcination/heat treatment parameters (JSONB)
    # Specifically for thermal processing observations
    # Can be empty dict {} if not applicable
    calcination_parameters = Column(JSONB, nullable=False, default=dict)

    # Free-form observation text
    # Detailed description of what was observed
    # This is the narrative component of the observation
    observations_text = Column('observations', Text, nullable=False)

    # Structured data collected (JSONB)
    # Numerical measurements, categorical observations, etc.
    # Allows querying observations by specific data values
    data = Column(JSONB, nullable=False, default=dict)

    # Conclusions drawn from this observation
    # What did you learn? What are the implications?
    conclusions = Column(Text, nullable=False)

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

    # Many-to-many: Observation relates to Catalysts
    catalysts = relationship(
        "Catalyst",
        secondary=catalyst_observation,
        back_populates="observations",
        doc="Catalysts this observation pertains to"
    )

    # Many-to-many: Observation relates to Samples
    samples = relationship(
        "Sample",
        secondary=sample_observation,
        back_populates="observations",
        doc="Samples this observation pertains to"
    )

    # Many-to-many: Supporting files
    files = relationship(
        "File",
        secondary=observation_file,
        doc="Files attached to this observation (images, data, documents)"
    )

    # Many-to-many: Users who contributed to this observation
    users = relationship(
        "User",
        secondary=user_observation,
        back_populates="observations",
        doc="Users who made or contributed to this observation"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Observation(id={self.id}, objective='{self.objective[:30]}...')>"

    @property
    def has_calcination_data(self) -> bool:
        """Check if calcination parameters were recorded."""
        return bool(self.calcination_parameters)

    @property
    def catalyst_count(self) -> int:
        """Number of catalysts this observation relates to."""
        return len(self.catalysts) if self.catalysts else 0

    @property
    def sample_count(self) -> int:
        """Number of samples this observation relates to."""
        return len(self.samples) if self.samples else 0

    @property
    def file_count(self) -> int:
        """Number of files attached to this observation."""
        return len(self.files) if self.files else 0

    def get_condition(self, key: str, default=None):
        """
        Safely retrieve a condition value.
        
        Args:
            key: The condition key to retrieve
            default: Value to return if key not found
            
        Returns:
            The condition value or default
        """
        if self.conditions:
            return self.conditions.get(key, default)
        return default

    def get_data_value(self, key: str, default=None):
        """
        Safely retrieve a data value.
        
        Args:
            key: The data key to retrieve
            default: Value to return if key not found
            
        Returns:
            The data value or default
        """
        if self.data:
            return self.data.get(key, default)
        return default
