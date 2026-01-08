/**
 * Central export for all custom hooks.
 *
 * This index provides convenient single-point imports for all React Query hooks.
 * Organized by domain to match the API service organization.
 *
 * Phase 1: Users, Chemicals, Methods, Supports, Catalysts
 * Phase 2: Files, Samples, Characterizations, Observations
 * Phase 3: Experiments, Waveforms, Reactors, Analyzers, Contaminants, Carriers, Groups
 */

// ============================================================================
// Utility Hooks
// ============================================================================
export * from './useSortableData';

// ============================================================================
// Core Domain Hooks
// ============================================================================
export * from './useUsers';
export * from './useFiles';

// ============================================================================
// Catalyst Domain Hooks
// ============================================================================
export * from './useChemicals';
export * from './useMethods';
export * from './useSupports';
export * from './useCatalysts';
export * from './useSamples';

// ============================================================================
// Characterization Domain Hooks
// ============================================================================
// Note: useCharacterizations and useObservations have some hooks with the same names
// as useCatalysts. We explicitly re-export to avoid ambiguity, preferring the
// hooks from useCharacterizations/useObservations for their respective domains.
export {
    useCharacterizations,
    useCharacterization,
    useCreateCharacterization,
    useUpdateCharacterization,
    useDeleteCharacterization,
    // These override the ones from useCatalysts - they call characterization API endpoints
    useAddCharacterizationToCatalyst,
    useRemoveCharacterizationFromCatalyst,
    // New hooks for managing relationships from characterization side
    useAddCatalystToCharacterization,
    useRemoveCatalystFromCharacterization,
    useAddSampleToCharacterization,
    useRemoveSampleFromCharacterization,
    useAddUserToCharacterization,
    useRemoveUserFromCharacterization,
} from './useCharacterizations';

export {
    useObservations,
    useObservation,
    useCreateObservation,
    useUpdateObservation,
    useDeleteObservation,
    useAddFileToObservation,
    useRemoveFileFromObservation,
    // These override the ones from useCatalysts - they call observation API endpoints
    useAddObservationToCatalyst,
    useRemoveObservationFromCatalyst,
    // New hooks for managing relationships from observation side
    useAddCatalystToObservation,
    useRemoveCatalystFromObservation,
    useAddSampleToObservation,
    useRemoveSampleFromObservation,
    useAddUserToObservation,
    useRemoveUserFromObservation,
} from './useObservations';

// ============================================================================
// Experiments Domain Hooks (Phase 3)
// ============================================================================
export * from './useWaveforms';
export * from './useReactors';
export * from './useProcessed';
export * from './useAnalyzers';
export * from './useExperiments';

// ============================================================================
// Reference Domain Hooks (Phase 3)
// ============================================================================
export * from './useContaminants';
export * from './useCarriers';
export * from './useGroups';
