"""
Experiments domain schemas.

Pydantic schemas for experimental testing and data collection entities:
- Waveform: Electrical waveform configurations
- Reactor: Reactor equipment
- Processed: Calculated experiment results
- Analyzer: Base + FTIR + OES subtypes
- Experiment: Base + Plasma + Photocatalysis + Misc subtypes

The Analyzer and Experiment hierarchies use polymorphic schemas with
type discriminators for proper serialization/deserialization.
"""

from app.schemas.experiments.waveform import (
    WaveformBase,
    WaveformCreate,
    WaveformUpdate,
    WaveformSimple,
    WaveformResponse
)
from app.schemas.experiments.reactor import (
    ReactorBase,
    ReactorCreate,
    ReactorUpdate,
    ReactorSimple,
    ReactorResponse
)
from app.schemas.experiments.processed import (
    ProcessedBase,
    ProcessedCreate,
    ProcessedUpdate,
    ProcessedSimple,
    ProcessedResponse
)
from app.schemas.experiments.analyzer import (
    # Base analyzer
    AnalyzerBase,
    AnalyzerCreate,
    AnalyzerUpdate,
    AnalyzerSimple,
    AnalyzerResponse,
    # FTIR
    FTIRBase,
    FTIRCreate,
    FTIRUpdate,
    FTIRResponse,
    # OES
    OESBase,
    OESCreate,
    OESUpdate,
    OESResponse,
    # Union types
    AnalyzerCreateUnion,
    AnalyzerResponseUnion
)
from app.schemas.experiments.experiment import (
    # Base experiment
    ExperimentBase,
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentSimple,
    ExperimentResponse,
    # Plasma
    PlasmaBase,
    PlasmaCreate,
    PlasmaUpdate,
    PlasmaResponse,
    # Photocatalysis
    PhotocatalysisBase,
    PhotocatalysisCreate,
    PhotocatalysisUpdate,
    PhotocatalysisResponse,
    # Misc
    MiscBase,
    MiscCreate,
    MiscUpdate,
    MiscResponse,
    # Union types
    ExperimentCreateUnion,
    ExperimentResponseUnion
)

__all__ = [
    # Waveform
    "WaveformBase",
    "WaveformCreate",
    "WaveformUpdate",
    "WaveformSimple",
    "WaveformResponse",
    # Reactor
    "ReactorBase",
    "ReactorCreate",
    "ReactorUpdate",
    "ReactorSimple",
    "ReactorResponse",
    # Processed
    "ProcessedBase",
    "ProcessedCreate",
    "ProcessedUpdate",
    "ProcessedSimple",
    "ProcessedResponse",
    # Analyzer base
    "AnalyzerBase",
    "AnalyzerCreate",
    "AnalyzerUpdate",
    "AnalyzerSimple",
    "AnalyzerResponse",
    # FTIR
    "FTIRBase",
    "FTIRCreate",
    "FTIRUpdate",
    "FTIRResponse",
    # OES
    "OESBase",
    "OESCreate",
    "OESUpdate",
    "OESResponse",
    # Analyzer unions
    "AnalyzerCreateUnion",
    "AnalyzerResponseUnion",
    # Experiment base
    "ExperimentBase",
    "ExperimentCreate",
    "ExperimentUpdate",
    "ExperimentSimple",
    "ExperimentResponse",
    # Plasma
    "PlasmaBase",
    "PlasmaCreate",
    "PlasmaUpdate",
    "PlasmaResponse",
    # Photocatalysis
    "PhotocatalysisBase",
    "PhotocatalysisCreate",
    "PhotocatalysisUpdate",
    "PhotocatalysisResponse",
    # Misc
    "MiscBase",
    "MiscCreate",
    "MiscUpdate",
    "MiscResponse",
    # Experiment unions
    "ExperimentCreateUnion",
    "ExperimentResponseUnion",
]