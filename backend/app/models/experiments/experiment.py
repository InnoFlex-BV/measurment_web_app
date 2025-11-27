"""
Experiment models representing catalytic experiments.

Experiments are the core data collection entities, recording the
conditions and results of catalytic testing. This module implements
joined-table inheritance with:
- Experiment: Base class with common fields
- Plasma: Plasma-catalysis experiment subtype
- Photocatalysis: Photocatalysis experiment subtype
- Misc: Miscellaneous experiment subtype

Database Schema (from 01_init.sql):
-----------------------------------
create table experiments (
    id serial primary key,
    name varchar(255) not null,
    experiment_type varchar(25) not null check ( 
        experiment_type in ('plasma', 'photocatalysis', 'misc')
    ),
    purpose varchar(255) not null,
    reactor_id integer references reactor(id) on delete restrict,
    analyzer_id integer references analyzers(id) on delete restrict,
    raw_data integer references files(id) on delete set null,
    processed_data jsonb,
    processed_table_id integer references processed(id) on delete set null,
    figures integer references files(id) on delete set null,
    discussed_in integer references files(id) on delete set null,
    conclusion text,
    notes text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table plasma (
    experiment_id integer primary key references experiments(id) on delete cascade,
    driving_waveform_id integer references waveforms(id) on delete restrict,
    delivered_power numeric(10,4),
    on_time integer,
    off_time integer,
    dc_voltage integer,
    dc_current integer,
    measured_waveform integer references files(id) on delete set null,
    electrode text,
    reactor_external_temperature integer
);

create table photocatalysis (
    experiment_id integer primary key references experiments(id) on delete cascade,
    wavelength numeric(10,4),
    power numeric(10,4)
);

create table misc (
    experiment_id integer primary key references experiments(id) on delete cascade,
    description text
);

Relationship Summary:
--------------------
- Reactor: equipment used (RESTRICT delete)
- Analyzer: measurement instrument (RESTRICT delete)
- Files: raw_data, figures, discussed_in (SET NULL delete)
- Processed: calculated results
- Samples: materials tested (via sample_experiment)
- Contaminants: target compounds (via contaminant_experiment with ppm)
- Carriers: carrier gases (via carrier_experiment with ratio)
- Groups: experiment collections (via group_experiment)
- Users: audit tracking (via user_experiment with changed_at)
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Import junction tables from related models
from app.models.catalysts.sample import sample_experiment
from app.models.reference.contaminant import contaminant_experiment
from app.models.reference.carrier import carrier_experiment
from app.models.reference.group import group_experiment


# Junction table for user-experiment audit tracking
user_experiment = Table(
    'user_experiment',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True),
    Column('changed_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)


class Experiment(Base):
    """
    Base Experiment model for catalytic experiments.
    
    This is the parent class for all experiment types. Common attributes
    are stored here, while type-specific parameters are in subclass tables.
    
    Experiment Types:
    - Plasma: Plasma-catalysis experiments (DBD, corona, etc.)
    - Photocatalysis: Light-driven catalytic reactions
    - Misc: Other experiment types
    
    Key Relationships:
    - reactor: Equipment used for the experiment
    - analyzer: Instrument for measuring results
    - samples: Catalyst samples tested
    - contaminants: Target compounds (with ppm concentration)
    - carriers: Carrier gases (with flow ratio)
    - groups: Experiment collections for analysis
    - users: Who performed/contributed to the experiment
    
    Data Storage:
    - raw_data: File with original instrument data
    - processed_data: JSONB for flexible calculated values
    - processed_results: Structured DRE/EY values (via Processed model)
    - figures: File with generated plots
    - discussed_in: File with related publication/report
    """

    __tablename__ = "experiments"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Experiment name/identifier
    # Should be descriptive and unique within a research group
    # Examples: "TiO2-Pt_500ppm-toluene_50W_2024-01-15"
    name = Column(String(255), nullable=False)

    # Discriminator for polymorphic identity
    # Values: 'plasma', 'photocatalysis', 'misc'
    experiment_type = Column(String(25), nullable=False)

    # Purpose/objective of this experiment
    # What question is this experiment trying to answer?
    purpose = Column(String(255), nullable=False)

    # Foreign key to reactor equipment
    # RESTRICT delete prevents deleting reactor if experiments reference it
    reactor_id = Column(
        Integer,
        ForeignKey('reactor.id', ondelete='RESTRICT'),
        nullable=True,
        index=True
    )

    # Foreign key to analyzer instrument
    # RESTRICT delete prevents deleting analyzer if experiments reference it
    analyzer_id = Column(
        Integer,
        ForeignKey('analyzers.id', ondelete='RESTRICT'),
        nullable=True,
        index=True
    )

    # Foreign key to raw data file
    raw_data_id = Column(
        'raw_data',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

    # Flexible storage for processed/calculated data
    # Can store any structured data not captured by Processed model
    processed_data = Column(JSONB, nullable=True)

    # Foreign key to structured processed results
    processed_table_id = Column(
        Integer,
        ForeignKey('processed.id', ondelete='SET NULL'),
        nullable=True
    )

    # Foreign key to figures file
    figures_id = Column(
        'figures',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

    # Foreign key to publication/report file
    discussed_in_id = Column(
        'discussed_in',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

    # Conclusion from this experiment
    conclusion = Column(Text, nullable=True)

    # Additional notes
    notes = Column(Text, nullable=True)

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
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_on': experiment_type,
        'polymorphic_identity': 'experiment',  # Base type (shouldn't be used directly)
        'with_polymorphic': '*'
    }

    # =========================================================================
    # Relationships
    # =========================================================================

    # Many-to-one: Reactor equipment
    reactor = relationship(
        "Reactor",
        back_populates="experiments",
        doc="Reactor used for this experiment"
    )

    # Many-to-one: Analyzer instrument
    analyzer = relationship(
        "Analyzer",
        back_populates="experiments",
        doc="Analyzer used for measurements"
    )

    # Many-to-one: Raw data file
    raw_data_file = relationship(
        "File",
        foreign_keys=[raw_data_id],
        doc="File containing raw instrument data"
    )

    # Many-to-one: Processed results
    processed_results = relationship(
        "Processed",
        back_populates="experiments",
        doc="Calculated performance metrics"
    )

    # Many-to-one: Figures file
    figures_file = relationship(
        "File",
        foreign_keys=[figures_id],
        doc="File containing experiment figures"
    )

    # Many-to-one: Publication/report file
    discussed_in_file = relationship(
        "File",
        foreign_keys=[discussed_in_id],
        doc="File where this experiment is discussed"
    )

    # Many-to-many: Samples tested
    samples = relationship(
        "Sample",
        secondary=sample_experiment,
        back_populates="experiments",
        doc="Catalyst samples tested in this experiment"
    )

    # Many-to-many: Target contaminants (junction has ppm)
    contaminants = relationship(
        "Contaminant",
        secondary=contaminant_experiment,
        back_populates="experiments",
        doc="Target contaminants with concentrations"
    )

    # Many-to-many: Carrier gases (junction has ratio)
    carriers = relationship(
        "Carrier",
        secondary=carrier_experiment,
        back_populates="experiments",
        doc="Carrier gases with flow ratios"
    )

    # Many-to-many: Experiment groups
    groups = relationship(
        "Group",
        secondary=group_experiment,
        back_populates="experiments",
        doc="Groups this experiment belongs to"
    )

    # Many-to-many: Users who worked on this experiment
    users = relationship(
        "User",
        secondary=user_experiment,
        back_populates="experiments",
        doc="Users who performed this experiment"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Experiment(id={self.id}, type='{self.experiment_type}', name='{self.name}')>"

    @property
    def sample_count(self) -> int:
        """Number of samples tested in this experiment."""
        return len(self.samples) if self.samples else 0

    @property
    def has_raw_data(self) -> bool:
        """Check if raw data file is attached."""
        return self.raw_data_id is not None

    @property
    def has_processed_data(self) -> bool:
        """Check if any processed data exists."""
        return self.processed_table_id is not None or self.processed_data is not None

    @property
    def has_conclusion(self) -> bool:
        """Check if conclusion has been recorded."""
        return bool(self.conclusion)


class Plasma(Experiment):
    """
    Plasma experiment model for plasma-catalysis experiments.
    
    Plasma catalysis combines non-thermal plasma with heterogeneous
    catalysts for pollutant decomposition, chemical synthesis, or
    other reactions. Key parameters include:
    
    Electrical Parameters:
    - driving_waveform: Waveform configuration (AC, pulsed, etc.)
    - delivered_power: Actual power delivered to plasma (W)
    - dc_voltage/dc_current: DC components if applicable
    
    Timing Parameters:
    - on_time: Plasma on duration (ms or s)
    - off_time: Plasma off duration for pulsed operation
    
    Physical Parameters:
    - electrode: Electrode configuration/material
    - reactor_external_temperature: External heating if used
    - measured_waveform: File with actual voltage/current waveforms
    
    Common plasma types:
    - DBD (Dielectric Barrier Discharge)
    - Corona discharge
    - Gliding arc
    - Microwave plasma
    """

    __tablename__ = "plasma"

    # Foreign key to parent table (shared primary key)
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        primary_key=True
    )

    # Reference to driving waveform configuration
    # RESTRICT prevents deleting waveform if referenced
    driving_waveform_id = Column(
        Integer,
        ForeignKey('waveforms.id', ondelete='RESTRICT'),
        nullable=True,
        index=True
    )

    # Power delivered to the plasma (W)
    delivered_power = Column(Numeric(10, 4), nullable=True)

    # Plasma on-time (for pulsed operation)
    # Units depend on context (typically ms or s)
    on_time = Column(Integer, nullable=True)

    # Plasma off-time (for pulsed operation)
    off_time = Column(Integer, nullable=True)

    # DC voltage component (V)
    dc_voltage = Column(Integer, nullable=True)

    # DC current component (mA or A)
    dc_current = Column(Integer, nullable=True)

    # File containing measured voltage/current waveforms
    measured_waveform_id = Column(
        'measured_waveform',
        Integer,
        ForeignKey('files.id', ondelete='SET NULL'),
        nullable=True
    )

    # Electrode configuration/material description
    # Example: "Stainless steel mesh, 100 mesh"
    electrode = Column(Text, nullable=True)

    # External reactor temperature (°C)
    # For heated plasma reactors
    reactor_external_temperature = Column(Integer, nullable=True)

    # =========================================================================
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_identity': 'plasma'
    }

    # =========================================================================
    # Relationships
    # =========================================================================

    # Many-to-one: Driving waveform configuration
    driving_waveform = relationship(
        "Waveform",
        back_populates="plasma_experiments",
        foreign_keys=[driving_waveform_id],
        doc="Waveform configuration for this experiment"
    )

    # Many-to-one: Measured waveform file
    measured_waveform_file = relationship(
        "File",
        foreign_keys=[measured_waveform_id],
        doc="File with measured voltage/current waveforms"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Plasma(id={self.experiment_id}, name='{self.name}', power={self.delivered_power})>"

    @property
    def is_pulsed(self) -> bool:
        """Check if this is a pulsed plasma experiment."""
        return self.on_time is not None and self.off_time is not None

    @property
    def duty_cycle(self) -> float:
        """Calculate duty cycle for pulsed operation."""
        if self.on_time and self.off_time:
            total = self.on_time + self.off_time
            return (self.on_time / total) * 100 if total > 0 else 0
        return 100.0  # Continuous operation


class Photocatalysis(Experiment):
    """
    Photocatalysis experiment model for light-driven catalytic reactions.
    
    Photocatalysis uses light energy to activate semiconductor catalysts
    for chemical reactions. Key parameters include:
    
    Light Parameters:
    - wavelength: Peak wavelength of light source (nm)
    - power: Light power or intensity (W or mW/cm²)
    
    Common light sources:
    - UV-C: 254 nm (mercury lamp)
    - UV-A: 365 nm (LED or fluorescent)
    - Visible: 400-700 nm (LEDs, solar simulator)
    
    Common photocatalysts:
    - TiO2 (anatase, P25)
    - ZnO
    - WO3
    - g-C3N4
    - Modified/doped variants
    """

    __tablename__ = "photocatalysis"

    # Foreign key to parent table (shared primary key)
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        primary_key=True
    )

    # Peak wavelength of light source (nm)
    wavelength = Column(Numeric(10, 4), nullable=True)

    # Light power or intensity
    # Units depend on context (W for total power, mW/cm² for intensity)
    power = Column(Numeric(10, 4), nullable=True)

    # =========================================================================
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_identity': 'photocatalysis'
    }

    def __repr__(self):
        """String representation for debugging."""
        return f"<Photocatalysis(id={self.experiment_id}, name='{self.name}', λ={self.wavelength}nm)>"

    @property
    def is_uv(self) -> bool:
        """Check if using UV light (< 400 nm)."""
        return self.wavelength is not None and float(self.wavelength) < 400

    @property
    def is_visible(self) -> bool:
        """Check if using visible light (400-700 nm)."""
        if self.wavelength is None:
            return False
        wl = float(self.wavelength)
        return 400 <= wl <= 700


class Misc(Experiment):
    """
    Miscellaneous experiment model for other experiment types.
    
    This subtype handles experiments that don't fit the plasma or
    photocatalysis categories. It has a single description field
    for capturing experiment-specific details.
    
    Example use cases:
    - Thermal catalysis experiments
    - Adsorption studies
    - Catalyst activation/pretreatment
    - Control experiments
    - Novel experiment types not yet formalized
    """

    __tablename__ = "misc"

    # Foreign key to parent table (shared primary key)
    experiment_id = Column(
        Integer,
        ForeignKey('experiments.id', ondelete='CASCADE'),
        primary_key=True
    )

    # Detailed description of this experiment type
    # Since misc experiments vary widely, this field captures
    # all the type-specific details
    description = Column(Text, nullable=True)

    # =========================================================================
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_identity': 'misc'
    }

    def __repr__(self):
        """String representation for debugging."""
        desc_preview = self.description[:30] + "..." if self.description and len(self.description) > 30 else self.description
        return f"<Misc(id={self.experiment_id}, name='{self.name}', desc='{desc_preview}')>"