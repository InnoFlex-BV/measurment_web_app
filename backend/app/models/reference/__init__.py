"""
Reference models for lookup tables and supporting data.

This subdomain contains reference/lookup tables that provide
standardized values for experiments:
- Contaminant: Target pollutant compounds (with ppm in junction)
- Carrier: Carrier/balance gases (with ratio in junction)
- Group: Experiment groupings for analysis

These models are relatively simple (mostly just name fields) but
their junction tables with experiments store additional data like
concentration (ppm) and flow ratios.
"""

from app.models.reference.contaminant import Contaminant, contaminant_experiment
from app.models.reference.carrier import Carrier, carrier_experiment
from app.models.reference.group import Group, group_experiment

__all__ = [
    # Models
    "Contaminant",
    "Carrier",
    "Group",
    # Junction tables (exported for use in other models)
    "contaminant_experiment",
    "carrier_experiment",
    "group_experiment",
]