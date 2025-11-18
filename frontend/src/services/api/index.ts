/**
 * Central export point for all API services.
 *
 * This index file provides a convenient way to import API services,
 * allowing components to import from a single location rather than
 * remembering individual service paths.
 *
 * Usage:
 * import { userApi, catalystApi } from '@/services/api';
 * import type { User, Catalyst } from '@/services/api';
 */

// Export all API service modules as default exports
export { default as userApi } from './users';
export { default as chemicalApi } from './chemicals';
export { default as methodApi } from './methods';
export { default as supportApi } from './supports';
export { default as catalystApi } from './catalysts';

// Export the API client and error type
export { default as apiClient } from './client';
export type { ApiError } from './client';

// Re-export all types from the types module
export type {
    // Core types
    User,
    UserCreate,
    UserUpdate,
    // Catalyst domain types
    Chemical,
    ChemicalCreate,
    ChemicalUpdate,
    Method,
    MethodCreate,
    MethodUpdate,
    Support,
    SupportCreate,
    SupportUpdate,
    Catalyst,
    CatalystSimple,
    CatalystCreate,
    CatalystUpdate,
    // Query parameter types
    PaginationParams,
    UserListParams,
    ChemicalListParams,
    MethodListParams,
    SupportListParams,
    CatalystListParams,
} from './types';
