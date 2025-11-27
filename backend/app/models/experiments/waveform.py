"""
Waveform model representing electrical waveform configurations.

Waveforms define the electrical signal parameters used in plasma experiments.
They capture both AC and pulsing characteristics that control the plasma
discharge behavior.

Database Schema (from 01_init.sql):
-----------------------------------
create table waveforms (
    id serial primary key,
    name varchar(255) not null,
    ac_frequency numeric(10,4),
    ac_duty_cycle numeric(10,4),
    pulsing_frequency numeric(10,4),
    pulsing_duty_cycle numeric(10,4),
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

Design Notes:
-------------
- All frequency/duty cycle fields are optional (nullable)
- Supports both continuous AC and pulsed waveforms
- Referenced by Plasma experiments as driving_waveform
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Waveform(Base):
    """
    Waveform model for plasma experiment electrical configurations.
    
    Plasma experiments use various waveform configurations to control
    the discharge characteristics. This model captures the key parameters:
    
    AC Parameters:
    - ac_frequency: Frequency of the AC component (Hz or kHz)
    - ac_duty_cycle: Duty cycle of AC signal (0-100%)
    
    Pulsing Parameters:
    - pulsing_frequency: Frequency of pulse envelope
    - pulsing_duty_cycle: On-time fraction of pulsing
    
    Example configurations:
    - Continuous AC: ac_frequency=50000, ac_duty_cycle=50
    - Pulsed DBD: ac_frequency=10000, pulsing_frequency=1000, pulsing_duty_cycle=50
    - DC pulsed: No AC, pulsing only
    """

    __tablename__ = "waveforms"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descriptive name for this waveform configuration
    # Examples: "10kHz Sinusoidal", "Pulsed DBD 1kHz", "Bipolar Square Wave"
    name = Column(String(255), nullable=False)

    # AC frequency in appropriate units (typically Hz or kHz)
    # The unit should be documented in the name or notes
    ac_frequency = Column(Numeric(10, 4), nullable=True)

    # AC duty cycle as percentage (0-100)
    # 50% = symmetric waveform
    ac_duty_cycle = Column(Numeric(10, 4), nullable=True)

    # Pulsing/modulation frequency
    # For burst-mode or pulsed operation
    pulsing_frequency = Column(Numeric(10, 4), nullable=True)

    # Pulsing duty cycle as percentage
    # Fraction of time the discharge is active
    pulsing_duty_cycle = Column(Numeric(10, 4), nullable=True)

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

    # One-to-many: Plasma experiments using this as driving waveform
    plasma_experiments = relationship(
        "Plasma",
        back_populates="driving_waveform",
        foreign_keys="[Plasma.driving_waveform_id]",
        doc="Plasma experiments using this driving waveform"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Waveform(id={self.id}, name='{self.name}')>"

    @property
    def is_pulsed(self) -> bool:
        """Check if this is a pulsed waveform configuration."""
        return self.pulsing_frequency is not None and self.pulsing_frequency > 0

    @property
    def has_ac(self) -> bool:
        """Check if this waveform has an AC component."""
        return self.ac_frequency is not None and self.ac_frequency > 0

    @property
    def experiment_count(self) -> int:
        """Number of experiments using this waveform."""
        return len(self.plasma_experiments) if self.plasma_experiments else 0