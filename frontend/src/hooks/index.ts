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
export * from './useCharacterizations';
export * from './useObservations';

// ============================================================================
// Experiments Domain Hooks (Phase 3)
// ============================================================================
export * from './useWaveforms';
export * from './useReactors';
export * from './useAnalyzers';
export * from './useExperiments';

// ============================================================================
// Reference Domain Hooks (Phase 3)
// ============================================================================
export * from './useContaminants';
export * from './useCarriers';
export * from './useGroups';
