/**
 * Central export point for all API services.
 *
 * This index file provides a convenient way to import API services,
 * allowing components to import from a single location rather than
 * remembering individual service paths.
 *
 * Usage:
 * import { userApi, catalystApi, sampleApi } from '@/services/api';
 * import type { User, Catalyst, Sample } from '@/services/api';
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
export { CHARACTERIZATION_TYPE_LABELS } from './types';
