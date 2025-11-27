"""
Analyzer models representing analytical instruments.

Analyzers are the instruments used to measure experimental outputs.
This module implements joined-table inheritance with:
- Analyzer: Base class with common fields
- FTIR: Fourier Transform Infrared spectrometer subtype
- OES: Optical Emission Spectrometer subtype

Database Schema (from 01_init.sql):
-----------------------------------
create table analyzers (
    id serial primary key,
    name varchar(255) not null,
    analyzer_type varchar(20) not null check (
       analyzer_type in ('ftir', 'oes')
    ),
    description text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table ftir (
   id integer primary key references analyzers(id) on delete cascade,
   path_length numeric(10,4),
   resolution numeric(10,4),
   interval numeric(10,4),
   scans integer
);

create table oes (
   id integer primary key references analyzers(id) on delete cascade,
   integration_time integer,
   scans integer
);

Joined Table Inheritance:
-------------------------
SQLAlchemy's joined table inheritance creates a separate table for each
subclass, with a foreign key back to the parent. When you query for an
FTIR analyzer, SQLAlchemy joins the analyzers and ftir tables automatically.

The analyzer_type column acts as a discriminator, telling SQLAlchemy which
subclass to instantiate when loading from the database.
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Analyzer(Base):
    """
    Base Analyzer model for analytical instruments.
    
    This is the parent class for all analyzer types. Common attributes
    like name and description are stored here, while type-specific
    parameters are stored in the subclass tables (ftir, oes).
    
    Analyzer Types:
    - FTIR: Fourier Transform Infrared - measures gas composition
    - OES: Optical Emission Spectrometer - measures plasma emissions
    
    The analyzer_type column serves as a discriminator for SQLAlchemy's
    polymorphic loading, determining which subclass to instantiate.
    """

    __tablename__ = "analyzers"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Analyzer name/identifier
    # Example: "Nicolet iS50 FTIR", "Ocean Optics USB4000"
    name = Column(String(255), nullable=False)

    # Discriminator column for polymorphic identity
    # Values: 'ftir', 'oes'
    analyzer_type = Column(String(20), nullable=False)

    # Detailed description of the analyzer
    # Configuration details, calibration notes, etc.
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
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_on': analyzer_type,
        'polymorphic_identity': 'analyzer',  # Base type (shouldn't be used directly)
        'with_polymorphic': '*'  # Load all subtypes when querying base
    }

    # =========================================================================
    # Relationships
    # =========================================================================

    # One-to-many: Experiments using this analyzer
    experiments = relationship(
        "Experiment",
        back_populates="analyzer",
        doc="Experiments that used this analyzer"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Analyzer(id={self.id}, type='{self.analyzer_type}', name='{self.name}')>"

    @property
    def experiment_count(self) -> int:
        """Number of experiments using this analyzer."""
        return len(self.experiments) if self.experiments else 0

    @property
    def is_in_use(self) -> bool:
        """Check if this analyzer is referenced by any experiments."""
        return self.experiment_count > 0


class FTIR(Analyzer):
    """
    FTIR (Fourier Transform Infrared) spectrometer model.
    
    FTIR analyzers measure infrared absorption spectra, commonly used
    for gas-phase analysis in catalysis research to identify and
    quantify reaction products and reactants.
    
    Key parameters:
    - path_length: Optical path length through the gas cell (cm)
    - resolution: Spectral resolution (cm⁻¹)
    - interval: Data point spacing or sampling interval
    - scans: Number of scans averaged per measurement
    
    Higher resolution gives more spectral detail but takes longer.
    More scans improve signal-to-noise but also take longer.
    """

    __tablename__ = "ftir"

    # Foreign key to parent table
    # This is also the primary key (shared primary key pattern)
    id = Column(
        Integer,
        ForeignKey('analyzers.id', ondelete='CASCADE'),
        primary_key=True
    )

    # Optical path length through gas cell
    # Longer path = more absorption = better sensitivity for low concentrations
    # Units: typically cm
    path_length = Column(Numeric(10, 4), nullable=True)

    # Spectral resolution
    # Lower number = higher resolution = more spectral detail
    # Units: cm⁻¹ (wavenumber)
    resolution = Column(Numeric(10, 4), nullable=True)

    # Data point spacing or sampling interval
    # Related to resolution but specifies actual data spacing
    interval = Column(Numeric(10, 4), nullable=True)

    # Number of scans averaged
    # More scans = better signal-to-noise ratio
    scans = Column(Integer, nullable=True)

    # =========================================================================
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_identity': 'ftir'
    }

    def __repr__(self):
        """String representation for debugging."""
        return f"<FTIR(id={self.id}, name='{self.name}', resolution={self.resolution})>"


class OES(Analyzer):
    """
    OES (Optical Emission Spectrometer) model.
    
    OES analyzers measure light emission from plasma discharges,
    used to characterize plasma properties and identify reactive
    species generated during plasma catalysis experiments.
    
    Key parameters:
    - integration_time: Exposure time per measurement (ms)
    - scans: Number of spectra averaged
    
    Longer integration time captures more light but may saturate
    on intense emissions. Averaging multiple scans improves SNR.
    """

    __tablename__ = "oes"

    # Foreign key to parent table
    id = Column(
        Integer,
        ForeignKey('analyzers.id', ondelete='CASCADE'),
        primary_key=True
    )

    # Integration/exposure time per measurement
    # Units: typically milliseconds
    integration_time = Column(Integer, nullable=True)

    # Number of spectra averaged
    scans = Column(Integer, nullable=True)

    # =========================================================================
    # Polymorphic Configuration
    # =========================================================================

    __mapper_args__ = {
        'polymorphic_identity': 'oes'
    }

    def __repr__(self):
        """String representation for debugging."""
        return f"<OES(id={self.id}, name='{self.name}', integration_time={self.integration_time})>"