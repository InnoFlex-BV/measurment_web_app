"""
Application models package.

This package contains all SQLAlchemy ORM models organized by domain:

Domains:
--------
- catalysts: Catalyst synthesis and inventory
  - Catalyst, Sample, Method, Chemical, Support, UserMethod
  
- analysis: Analytical chemistry measurements
  - Characterization, Observation
  
- experiments: Performance testing (Phase 3)
  - Experiment, Plasma, Photocatalysis, Misc
  - Reactor, Analyzer, FTIR, OES
  - Processed
  
- reference: Supporting reference data (Phase 4)
  - Contaminant, Carrier, Waveform, Group
  
- core: Fundamental infrastructure
  - User, File

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
# File will be added in Phase 3
# from app.models.core.file import File

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
# Experiments Domain (Phase 3)
# =============================================================================
# from app.models.experiments import (
#     Experiment, Plasma, Photocatalysis, Misc,
#     Reactor, Analyzer, FTIR, OES,
#     Processed, user_experiment
# )

# =============================================================================
# Reference Domain (Phase 4)
# =============================================================================
# from app.models.reference import (
#     Contaminant, Carrier, Waveform, Group
# )

# =============================================================================
# Exports
# =============================================================================
__all__ = [
    # Core
    "User",
    # "File",  # Phase 3

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
]
