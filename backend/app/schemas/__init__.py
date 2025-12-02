"""
Application schemas package.

This package contains all Pydantic schemas organized by domain.
Schemas are used for request/response validation in FastAPI endpoints.

Schema Naming Convention:
------------------------
Each entity typically has these schema variants:
- Base: Common fields shared across operations
- Create: Fields for POST requests (excludes generated fields)
- Update: Optional fields for PATCH requests
- Simple: Minimal fields for nested representations
- Response: Complete fields for GET responses

Domains:
--------
- core: Fundamental infrastructure (User, File, Audit)
- catalysts: Catalyst synthesis and inventory
- analysis: Analytical chemistry measurements
- experiments: Performance testing
- reference: Supporting reference data

Usage:
------
Schemas can be imported directly:
    from app.schemas import CatalystCreate, CatalystResponse
    
Or from domain subpackages:
    from app.schemas.catalysts import CatalystCreate
    from app.schemas.analysis import CharacterizationResponse
"""

# =============================================================================
# Core Domain
# =============================================================================
from app.schemas.core.user import (
    UserBase, UserCreate, UserUpdate, UserSimple, UserResponse
)
from app.schemas.core.file import (
    FileBase, FileCreate, FileUpdate, FileSimple, FileResponse
)
from app.schemas.core.audit import (
    UserContributionBase, UserContributionResponse,
    CatalystContribution, SampleContribution,
    CharacterizationContribution, ObservationContribution,
    ExperimentContribution, EntityContributors, UserActivitySummary
)

# =============================================================================
# Catalyst Domain
# =============================================================================
from app.schemas.catalysts.chemical import (
    ChemicalBase, ChemicalCreate, ChemicalUpdate,
    ChemicalSimple, ChemicalResponse
)
from app.schemas.catalysts.method import (
    MethodBase, MethodCreate, MethodUpdate,
    MethodSimple, MethodResponse,
    UserMethodCreate, UserMethodResponse
)
from app.schemas.catalysts.support import (
    SupportBase, SupportCreate, SupportUpdate, SupportResponse
)
from app.schemas.catalysts.catalyst import (
    CatalystBase, CatalystCreate, CatalystUpdate,
    CatalystSimple, CatalystResponse
)
from app.schemas.catalysts.sample import (
    SampleBase, SampleCreate, SampleUpdate,
    SampleSimple, SampleResponse
)

# =============================================================================
# Analysis Domain
# =============================================================================
from app.schemas.analysis.characterization import (
    CharacterizationBase, CharacterizationCreate, CharacterizationUpdate,
    CharacterizationSimple, CharacterizationResponse
)
from app.schemas.analysis.observation import (
    ObservationBase, ObservationCreate, ObservationUpdate,
    ObservationSimple, ObservationResponse
)

# =============================================================================
# Experiments Domain
# =============================================================================
from app.schemas.experiments.waveform import (
    WaveformBase, WaveformCreate, WaveformUpdate,
    WaveformSimple, WaveformResponse
)
from app.schemas.experiments.reactor import (
    ReactorBase, ReactorCreate, ReactorUpdate,
    ReactorSimple, ReactorResponse
)
from app.schemas.experiments.processed import (
    ProcessedBase, ProcessedCreate, ProcessedUpdate,
    ProcessedSimple, ProcessedResponse
)
from app.schemas.experiments.analyzer import (
    AnalyzerBase, AnalyzerCreate, AnalyzerUpdate, AnalyzerSimple, AnalyzerResponse,
    FTIRBase, FTIRCreate, FTIRUpdate, FTIRResponse,
    OESBase, OESCreate, OESUpdate, OESResponse,
    AnalyzerCreateUnion, AnalyzerResponseUnion
)
from app.schemas.experiments.experiment import (
    ExperimentBase, ExperimentCreate, ExperimentUpdate, ExperimentSimple, ExperimentResponse,
    PlasmaBase, PlasmaCreate, PlasmaUpdate, PlasmaResponse,
    PhotocatalysisBase, PhotocatalysisCreate, PhotocatalysisUpdate, PhotocatalysisResponse,
    MiscBase, MiscCreate, MiscUpdate, MiscResponse,
    ExperimentCreateUnion, ExperimentResponseUnion
)

# =============================================================================
# Reference Domain
# =============================================================================
from app.schemas.reference.contaminant import (
    ContaminantBase, ContaminantCreate, ContaminantUpdate,
    ContaminantSimple, ContaminantWithPpm, ContaminantResponse,
    ContaminantExperimentData
)
from app.schemas.reference.carrier import (
    CarrierBase, CarrierCreate, CarrierUpdate,
    CarrierSimple, CarrierWithRatio, CarrierResponse,
    CarrierExperimentData
)
from app.schemas.reference.group import (
    GroupBase, GroupCreate, GroupUpdate, GroupSimple, GroupResponse
)

# =============================================================================
# Exports
# =============================================================================
__all__ = [
    # Core - User
    "UserBase", "UserCreate", "UserUpdate", "UserSimple", "UserResponse",
    # Core - File
    "FileBase", "FileCreate", "FileUpdate", "FileSimple", "FileResponse",
    # Core - Audit
    "UserContributionBase", "UserContributionResponse",
    "CatalystContribution", "SampleContribution",
    "CharacterizationContribution", "ObservationContribution",
    "ExperimentContribution", "EntityContributors", "UserActivitySummary",

    # Catalysts - Chemical
    "ChemicalBase", "ChemicalCreate", "ChemicalUpdate",
    "ChemicalSimple", "ChemicalResponse",
    # Catalysts - Method
    "MethodBase", "MethodCreate", "MethodUpdate",
    "MethodSimple", "MethodResponse",
    "UserMethodCreate", "UserMethodResponse",
    # Catalysts - Support
    "SupportBase", "SupportCreate", "SupportUpdate", "SupportResponse",
    # Catalysts - Catalyst
    "CatalystBase", "CatalystCreate", "CatalystUpdate",
    "CatalystSimple", "CatalystResponse",
    # Catalysts - Sample
    "SampleBase", "SampleCreate", "SampleUpdate",
    "SampleSimple", "SampleResponse",

    # Analysis - Characterization
    "CharacterizationBase", "CharacterizationCreate", "CharacterizationUpdate",
    "CharacterizationSimple", "CharacterizationResponse",
    # Analysis - Observation
    "ObservationBase", "ObservationCreate", "ObservationUpdate",
    "ObservationSimple", "ObservationResponse",

    # Experiments - Waveform
    "WaveformBase", "WaveformCreate", "WaveformUpdate",
    "WaveformSimple", "WaveformResponse",
    # Experiments - Reactor
    "ReactorBase", "ReactorCreate", "ReactorUpdate",
    "ReactorSimple", "ReactorResponse",
    # Experiments - Processed
    "ProcessedBase", "ProcessedCreate", "ProcessedUpdate",
    "ProcessedSimple", "ProcessedResponse",
    # Experiments - Analyzer
    "AnalyzerBase", "AnalyzerCreate", "AnalyzerUpdate", "AnalyzerSimple", "AnalyzerResponse",
    "FTIRBase", "FTIRCreate", "FTIRUpdate", "FTIRResponse",
    "OESBase", "OESCreate", "OESUpdate", "OESResponse",
    "AnalyzerCreateUnion", "AnalyzerResponseUnion",
    # Experiments - Experiment
    "ExperimentBase", "ExperimentCreate", "ExperimentUpdate", "ExperimentSimple", "ExperimentResponse",
    "PlasmaBase", "PlasmaCreate", "PlasmaUpdate", "PlasmaResponse",
    "PhotocatalysisBase", "PhotocatalysisCreate", "PhotocatalysisUpdate", "PhotocatalysisResponse",
    "MiscBase", "MiscCreate", "MiscUpdate", "MiscResponse",
    "ExperimentCreateUnion", "ExperimentResponseUnion",

    # Reference - Contaminant
    "ContaminantBase", "ContaminantCreate", "ContaminantUpdate",
    "ContaminantSimple", "ContaminantWithPpm", "ContaminantResponse",
    "ContaminantExperimentData",
    # Reference - Carrier
    "CarrierBase", "CarrierCreate", "CarrierUpdate",
    "CarrierSimple", "CarrierWithRatio", "CarrierResponse",
    "CarrierExperimentData",
    # Reference - Group
    "GroupBase", "GroupCreate", "GroupUpdate", "GroupSimple", "GroupResponse",
]


# =============================================================================
# Resolve Forward References
# =============================================================================
# After all schemas are imported, we need to rebuild models that use
# string forward references (e.g., "MethodSimple") so Pydantic can 
# resolve them to actual schema classes.

def _rebuild_models():
    """Rebuild all Response schemas to resolve forward references."""
    # Build a namespace with all Simple schemas that are referenced
    namespace = {
        # Core
        'UserSimple': UserSimple,
        'FileSimple': FileSimple,
        # Catalysts
        'ChemicalSimple': ChemicalSimple,
        'MethodSimple': MethodSimple,
        'CatalystSimple': CatalystSimple,
        'SampleSimple': SampleSimple,
        'SupportResponse': SupportResponse,  # Support doesn't have Simple variant
        # Analysis
        'CharacterizationSimple': CharacterizationSimple,
        'ObservationSimple': ObservationSimple,
        # Experiments
        'WaveformSimple': WaveformSimple,
        'ReactorSimple': ReactorSimple,
        'ProcessedSimple': ProcessedSimple,
        'ExperimentSimple': ExperimentSimple,
        'AnalyzerSimple': AnalyzerSimple,
        'PlasmaResponse': PlasmaResponse,
        # Reference
        'ContaminantSimple': ContaminantSimple,
        'CarrierSimple': CarrierSimple,
        'GroupSimple': GroupSimple,
        # Also include Response classes for nesting
        'UserMethodResponse': UserMethodResponse,
    }

    # Core domain
    UserResponse.model_rebuild(_types_namespace=namespace)
    FileResponse.model_rebuild(_types_namespace=namespace)

    # Catalysts domain
    CatalystResponse.model_rebuild(_types_namespace=namespace)
    MethodResponse.model_rebuild(_types_namespace=namespace)
    SampleResponse.model_rebuild(_types_namespace=namespace)
    UserMethodResponse.model_rebuild(_types_namespace=namespace)

    # Analysis domain
    CharacterizationResponse.model_rebuild(_types_namespace=namespace)
    ObservationResponse.model_rebuild(_types_namespace=namespace)

    # Experiments domain
    AnalyzerResponse.model_rebuild(_types_namespace=namespace)
    ExperimentResponse.model_rebuild(_types_namespace=namespace)
    WaveformResponse.model_rebuild(_types_namespace=namespace)
    ReactorResponse.model_rebuild(_types_namespace=namespace)
    ProcessedResponse.model_rebuild(_types_namespace=namespace)
    PlasmaResponse.model_rebuild(_types_namespace=namespace)
    PhotocatalysisResponse.model_rebuild(_types_namespace=namespace)
    MiscResponse.model_rebuild(_types_namespace=namespace)
    GroupResponse.model_rebuild(_types_namespace=namespace)

_rebuild_models()
