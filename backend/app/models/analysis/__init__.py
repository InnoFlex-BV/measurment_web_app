"""
Analysis domain models.

This domain contains models for analytical chemistry entities that measure
and characterize catalyst and sample properties. The analysis workflow
typically follows this pattern:

1. A catalyst or sample is selected for analysis
2. A characterization technique is performed (XRD, BET, TEM, etc.)
3. Raw and processed data files are generated
4. Observations are recorded about the process and results

Entities in this domain:
- Characterization: Records of analytical measurements
- Observation: Qualitative notes and structured data about processes

Junction tables:
- user_characterization: Audit tracking for characterizations
- user_observation: Audit tracking for observations
- observation_file: Links observations to files

These entities connect to catalysts and samples through many-to-many
relationships, allowing comprehensive tracking of all analytical work
performed on research materials.
"""

from app.models.analysis.characterization import Characterization, user_characterization
from app.models.analysis.observation import Observation, observation_file, user_observation

__all__ = [
    "Characterization",
    "Observation",
    "user_characterization",
    "user_observation",
    "observation_file",
]
