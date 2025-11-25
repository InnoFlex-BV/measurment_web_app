"""
Catalyst domain models.

This domain contains models related to catalyst synthesis and inventory:
- Catalyst: Synthesized catalyst materials
- Sample: Prepared portions of catalysts for testing
- Method: Synthesis procedures
- Chemical: Chemical compounds used in synthesis
- Support: Substrate materials for supported catalysts
- UserMethod: Method modification history (association model)

Junction tables in this domain:
- chemical_method: Links methods to chemicals
- catalyst_catalyst: Self-referential for derivation chains
- catalyst_characterization: Links catalysts to characterizations
- catalyst_observation: Links catalysts to observations
- user_catalyst: Audit tracking for catalyst work
- sample_characterization: Links samples to characterizations
- sample_observation: Links samples to observations
- sample_experiment: Links samples to experiments
- user_sample: Audit tracking for sample work
"""

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

__all__ = [
    # Models
    "Chemical",
    "Method",
    "UserMethod",
    "Support",
    "Catalyst",
    "Sample",
    # Junction tables (exported for reference/queries)
    "chemical_method",
    "catalyst_catalyst",
    "catalyst_characterization",
    "catalyst_observation",
    "user_catalyst",
    "sample_characterization",
    "sample_observation",
    "sample_experiment",
    "user_sample",
]
