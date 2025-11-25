"""
Characterization model representing analytical measurements.

Characterizations are the analytical techniques used to understand the
physical and chemical properties of catalysts and samples. Common
characterization techniques in catalyst research include:

- XRD (X-ray Diffraction): Crystal structure and phase identification
- BET: Surface area measurement
- TEM/SEM: Microscopy for morphology and particle size
- XPS: Surface chemical composition
- TPR/TPD: Temperature-programmed reduction/desorption
- FTIR: Functional group identification
- ICP-OES: Elemental composition

Each characterization record represents a single analytical measurement
session, linking to:
- The catalyst(s) or sample(s) that were analyzed
- Raw data files (instrument output)
- Processed data files (analyzed results)
- Users who performed the characterization

The many-to-many relationships with catalysts and samples allow flexibility:
- A single characterization can analyze multiple samples (comparison studies)
- A catalyst/sample can have multiple characterizations (different techniques)

Design Philosophy:
-----------------
This model is intentionally lightweight in terms of stored attributes.
Rather than trying to capture all possible characterization parameters
(which vary enormously by technique), we store:
1. The technique type (type_name)
2. A description field for technique-specific details
3. References to data files containing the actual measurements

This approach is more flexible and future-proof than trying to anticipate
every possible characterization parameter. Detailed analysis happens in
the data files themselves.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Import junction tables from related models
# These are defined in the models that "own" the relationship
from app.models.catalysts.catalyst import catalyst_characterization
from app.models.catalysts.sample import sample_characterization


# Junction table for user-characterization audit tracking
# Records which users performed each characterization and when
user_characterization = Table(
    'user_characterization',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('characterization_id', Integer, ForeignKey('characterizations.id', ondelete='CASCADE'), primary_key=True),
    Column('changed_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)


class Characterization(Base):
    """
    Characterization model for analytical measurements.
    
    Each characterization record represents a single analytical session
    where one or more catalysts/samples were measured using a specific
    technique. The actual measurement data is stored in external files
    referenced by the raw_data and processed_data foreign keys.
    
    Common Characterization Types:
    - "XRD" - X-ray diffraction for crystal structure
    - "BET" - Brunauer-Emmett-Teller surface area
    - "TEM" - Transmission electron microscopy
    - "SEM" - Scanning electron microscopy  
    - "XPS" - X-ray photoelectron spectroscopy
    - "FTIR" - Fourier transform infrared spectroscopy
    - "TPR" - Temperature programmed reduction
    - "TPD" - Temperature programmed desorption
    - "TGA" - Thermogravimetric analysis
    - "ICP-OES" - Inductively coupled plasma optical emission
    
    The description field should contain technique-specific parameters:
    - For XRD: radiation source, 2θ range, scan rate
    - For BET: adsorbate gas, temperature, degas conditions
    - For TEM: accelerating voltage, magnification
    """

    __tablename__ = "characterizations"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Type of characterization technique
    # Should be a standardized abbreviation for consistency
    # Examples: "XRD", "BET", "TEM", "SEM", "XPS", "FTIR"
    type_name = Column(String(255), nullable=False, index=True)

    # Detailed description of the characterization
    # Include technique-specific parameters, conditions, and notes
    # Example for XRD: "Cu Kα radiation, 2θ = 10-80°, 0.02°/step, 
    #                   2s/step, room temperature"
    description = Column(Text, nullable=True)

    # Foreign key to processed data file
    # Contains analyzed/interpreted results (plots, fitted parameters, etc.)
    processed_data_id = Column(
        'processed_data',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

    # Foreign key to raw data file
    # Contains original instrument output before processing
    raw_data_id = Column(
        'raw_data',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

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

    # Many-to-many: Characterization performed on Catalysts
    catalysts = relationship(
        "Catalyst",
        secondary=catalyst_characterization,
        back_populates="characterizations",
        doc="Catalysts that were analyzed in this characterization"
    )

    # Many-to-many: Characterization performed on Samples
    samples = relationship(
        "Sample",
        secondary=sample_characterization,
        back_populates="characterizations",
        doc="Samples that were analyzed in this characterization"
    )

    # Many-to-one: Processed data file
    processed_data_file = relationship(
        "File",
        foreign_keys=[processed_data_id],
        doc="File containing processed/analyzed data"
    )

    # Many-to-one: Raw data file
    raw_data_file = relationship(
        "File",
        foreign_keys=[raw_data_id],
        doc="File containing raw instrument data"
    )

    # Many-to-many: Users who performed this characterization
    users = relationship(
        "User",
        secondary=user_characterization,
        back_populates="characterizations",
        doc="Users who performed or contributed to this characterization"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Characterization(id={self.id}, type='{self.type_name}')>"

    @property
    def has_raw_data(self) -> bool:
        """Check if raw data file is attached."""
        return self.raw_data_id is not None

    @property
    def has_processed_data(self) -> bool:
        """Check if processed data file is attached."""
        return self.processed_data_id is not None

    @property
    def catalyst_count(self) -> int:
        """Number of catalysts analyzed in this characterization."""
        return len(self.catalysts) if self.catalysts else 0

    @property
    def sample_count(self) -> int:
        """Number of samples analyzed in this characterization."""
        return len(self.samples) if self.samples else 0

    @property
    def total_materials_analyzed(self) -> int:
        """Total number of materials (catalysts + samples) analyzed."""
        return self.catalyst_count + self.sample_count
