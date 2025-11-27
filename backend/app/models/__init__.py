"""
Application models package.

This package contains all SQLAlchemy ORM models organized by domain:

Domains:
--------
- core: Fundamental infrastructure
  - User, File
  
- catalysts: Catalyst synthesis and inventory
  - Catalyst, Sample, Method, Chemical, Support, UserMethod
  
- analysis: Analytical chemistry measurements
  - Characterization, Observation
  
- experiments: Performance testing
  - Experiment, Plasma, Photocatalysis, Misc
  - Reactor, Analyzer, FTIR, OES
  - Waveform, Processed
  
- reference: Supporting reference data
  - Contaminant, Carrier, Group

Junction Tables:
----------------
Many-to-many relationships are implemented through junction tables:
- chemical_method: Methods ↔ Chemicals
- catalyst_catalyst: Catalyst derivation chains
- catalyst_characterization: Catalysts ↔ Characterizations
- catalyst_observation: Catalysts ↔ Observations
- sample_characterization: Samples ↔ Characterizations
- sample_observation: Samples ↔ Observations
- sample_experiment: Samples ↔ Experiments
- observation_file: Observations ↔ Files
- group_experiment: Groups ↔ Experiments
- contaminant_experiment: Contaminants ↔ Experiments (with ppm)
- carrier_experiment: Carriers ↔ Experiments (with ratio)
- user_catalyst, user_sample, user_characterization, 
  user_observation, user_experiment: User audit tracking

Import Pattern:
---------------
Models can be imported directly from this package:
    from app.models import Catalyst, Sample, User
    
Or from their domain subpackage:
    from app.models.catalysts import Catalyst, Sample
    from app.models.analysis import Characterization
"""

# =============================================================================
# Core Domain
# =============================================================================
from app.models.core.user import User
from app.models.core.file import File

# =============================================================================
# Catalyst Domain
# =============================================================================
from app.models.catalysts.chemical import Chemical
from app.models.catalysts.method import Method, UserMethod, chemical_method
from app.models.catalysts.support import Support
from app.models.catalysts.catalyst import (
    Catalyst,
    catalyst_catalyst,
    catalyst_characterization,
    catalyst_observation,
    user_catalyst
)
from app.models.catalysts.sample import (
    Sample,
    sample_characterization,
    sample_observation,
    sample_experiment,
    user_sample
)

# =============================================================================
# Analysis Domain
# =============================================================================
from app.models.analysis.characterization import (
    Characterization,
    user_characterization
)
from app.models.analysis.observation import (
    Observation,
    observation_file,
    user_observation
)

# =============================================================================
# Experiments Domain
# =============================================================================
from app.models.experiments.waveform import Waveform
from app.models.experiments.reactor import Reactor
from app.models.experiments.processed import Processed
from app.models.experiments.analyzer import Analyzer, FTIR, OES
from app.models.experiments.experiment import (
    Experiment, Plasma, Photocatalysis, Misc,
    user_experiment
)

# =============================================================================
# Reference Domain
# =============================================================================
from app.models.reference.contaminant import Contaminant, contaminant_experiment
from app.models.reference.carrier import Carrier, carrier_experiment
from app.models.reference.group import Group, group_experiment

# =============================================================================
# Exports
# =============================================================================
__all__ = [
    # Core
    "User",
    "File",

    # Catalysts
    "Chemical",
    "Method",
    "UserMethod",
    "Support",
    "Catalyst",
    "Sample",

    # Analysis
    "Characterization",
    "Observation",

    # Experiments
    "Waveform",
    "Reactor",
    "Processed",
    "Analyzer",
    "FTIR",
    "OES",
    "Experiment",
    "Plasma",
    "Photocatalysis",
    "Misc",

    # Reference
    "Contaminant",
    "Carrier",
    "Group",

    # Junction tables (for advanced queries)
    "chemical_method",
    "catalyst_catalyst",
    "catalyst_characterization",
    "catalyst_observation",
    "user_catalyst",
    "sample_characterization",
    "sample_observation",
    "sample_experiment",
    "user_sample",
    "user_characterization",
    "observation_file",
    "user_observation",
    "user_experiment",
    "contaminant_experiment",
    "carrier_experiment",
    "group_experiment",
]
