"""
Experiments domain models.

This subdomain contains models for experimental testing and data collection:
- Waveform: Electrical waveform configurations for plasma experiments
- Reactor: Reactor equipment
- Processed: Calculated experiment results (DRE, EY)
- Analyzer: Base analyzer + FTIR and OES subtypes
- Experiment: Base experiment + Plasma, Photocatalysis, and Misc subtypes

The Analyzer and Experiment hierarchies use SQLAlchemy's joined-table
inheritance pattern, where each subtype has its own table joined to
the parent table via foreign key.
"""

from app.models.experiments.waveform import Waveform
from app.models.experiments.reactor import Reactor
from app.models.experiments.processed import Processed
from app.models.experiments.analyzer import Analyzer, FTIR, OES
from app.models.experiments.experiment import (
    Experiment, Plasma, Photocatalysis, Misc,
    user_experiment
)

__all__ = [
    # Support models
    "Waveform",
    "Reactor",
    "Processed",
    # Analyzer hierarchy
    "Analyzer",
    "FTIR",
    "OES",
    # Experiment hierarchy
    "Experiment",
    "Plasma",
    "Photocatalysis",
    "Misc",
    # Junction table
    "user_experiment",
]