/**
 * Central export point for all API services.
 *
 * This index file provides a convenient way to import API services,
 * allowing components to import from a single location rather than
 * remembering individual service paths.
 *
 * Usage:
 * import { userApi, catalystApi, experimentApi } from '@/services/api';
 * import type { User, Catalyst, Experiment } from '@/services/api';
 */

// ============================================================================
// API Service Exports
// ============================================================================

// Core domain services
export { default as userApi } from './users';
export { default as fileApi } from './files';

// Catalyst domain services
export { default as chemicalApi } from './chemicals';
export { default as methodApi } from './methods';
export { default as supportApi } from './supports';
export { default as catalystApi } from './catalysts';
export { default as sampleApi } from './samples';

// Characterization domain services
export { default as characterizationApi } from './characterizations';
export { default as observationApi } from './observations';

// Experiments domain services (Phase 3)
export { default as waveformApi } from './waveforms';
export { default as reactorApi } from './reactors';
export { default as analyzerApi } from './analyzers';
export { default as experimentApi } from './experiments';

// Reference domain services (Phase 3)
export { default as contaminantApi } from './contaminants';
export { default as carrierApi } from './carriers';
export { default as groupApi } from './groups';

// Export the API client and error type
export { default as apiClient } from './client';
export type { ApiError } from './client';

// ============================================================================
// Type Re-exports
// ============================================================================

export type {
    // Core types
    User,
    UserCreate,
    UserUpdate,
    UserSimple,
    UserStats,

    // File types
    FileMetadata,
    FileMetadataSimple,
    FileCreate,
    FileUpdate,

    // Catalyst domain types
    Chemical,
    ChemicalCreate,
    ChemicalUpdate,
    ChemicalSimple,

    Method,
    MethodCreate,
    MethodUpdate,
    MethodSimple,

    Support,
    SupportCreate,
    SupportUpdate,
    SupportSimple,

    Catalyst,
    CatalystSimple,
    CatalystCreate,
    CatalystUpdate,

    // Sample types
    Sample,
    SampleSimple,
    SampleCreate,
    SampleUpdate,

    // Characterization types
    Characterization,
    CharacterizationSimple,
    CharacterizationCreate,
    CharacterizationUpdate,
    CharacterizationType,

    // Observation types
    Observation,
    ObservationSimple,
    ObservationCreate,
    ObservationUpdate,

    // Waveform types (Phase 3)
    Waveform,
    WaveformSimple,
    WaveformCreate,
    WaveformUpdate,
    WaveformListParams,

    // Reactor types (Phase 3)
    Reactor,
    ReactorSimple,
    ReactorCreate,
    ReactorUpdate,
    ReactorListParams,

    // Processed types (Phase 3)
    Processed,
    ProcessedSimple,
    ProcessedCreate,
    ProcessedUpdate,
    ProcessedListParams,

    // Analyzer types (Phase 3 - polymorphic)
    AnalyzerType,
    AnalyzerBase,
    FTIRAnalyzer,
    OESAnalyzer,
    Analyzer,
    AnalyzerSimple,
    FTIRCreate,
    OESCreate,
    AnalyzerCreate,
    FTIRUpdate,
    OESUpdate,
    AnalyzerUpdate,
    AnalyzerListParams,

    // Contaminant types (Phase 3)
    Contaminant,
    ContaminantSimple,
    ContaminantWithPpm,
    ContaminantCreate,
    ContaminantUpdate,
    ContaminantListParams,
    ContaminantExperimentData,

    // Carrier types (Phase 3)
    Carrier,
    CarrierSimple,
    CarrierWithRatio,
    CarrierCreate,
    CarrierUpdate,
    CarrierListParams,
    CarrierExperimentData,

    // Group types (Phase 3)
    Group,
    GroupSimple,
    GroupCreate,
    GroupUpdate,
    GroupListParams,

    // Experiment types (Phase 3 - polymorphic)
    ExperimentType,
    ExperimentSimple,
    ExperimentBase,
    PlasmaExperiment,
    PhotocatalysisExperiment,
    MiscExperiment,
    Experiment,
    PlasmaCreate,
    PhotocatalysisCreate,
    MiscCreate,
    ExperimentCreate,
    PlasmaUpdate,
    PhotocatalysisUpdate,
    MiscUpdate,
    ExperimentUpdate,
    ExperimentListParams,

    // Query parameter types
    PaginationParams,
    UserListParams,
    FileListParams,
    ChemicalListParams,
    MethodListParams,
    SupportListParams,
    CatalystListParams,
    SampleListParams,
    CharacterizationListParams,
    ObservationListParams,

    // Utility types
    PaginatedResponse,
} from './types';

// Export constants
export {
    CHARACTERIZATION_TYPE_LABELS,
    ANALYZER_TYPE_LABELS,
    EXPERIMENT_TYPE_LABELS,
} from './types';

// Export type guards
export {
    isPlasmaExperiment,
    isPhotocatalysisExperiment,
    isMiscExperiment,
    isFTIRAnalyzer,
    isOESAnalyzer,
} from './types';
