/**
 * Custom hooks for observation operations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. These hooks provide CRUD operations plus relationship
 * management for files and entity links.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    observationApi,
    type Observation,
    type ObservationCreate,
    type ObservationUpdate,
    type ObservationListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const observationKeys = {
    all: ['observations'] as const,
    lists: () => [...observationKeys.all, 'list'] as const,
    list: (params?: ObservationListParams) => [...observationKeys.lists(), params] as const,
    details: () => [...observationKeys.all, 'detail'] as const,
    detail: (id: number) => [...observationKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of observations with optional filtering.
 */
export function useObservations(
    params?: ObservationListParams
): UseQueryResult<Observation[], Error> {
    return useQuery({
        queryKey: observationKeys.list(params),
        queryFn: () => observationApi.list(params),
    });
}

/**
 * Hook to fetch a single observation by ID with optional relationship inclusion.
 */
export function useObservation(
    id?: number,
    include?: string
): UseQueryResult<Observation, Error> {
    return useQuery({
        queryKey: [...observationKeys.detail(id!), include],
        queryFn: () => observationApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new observation.
 */
export function useCreateObservation(): UseMutationResult<
    Observation,
    Error,
    ObservationCreate
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ObservationCreate) => observationApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: observationKeys.lists() });
        },
    });
}

/**
 * Hook to update an existing observation.
 */
export function useUpdateObservation(): UseMutationResult<
    Observation,
    Error,
    { id: number; data: ObservationUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => observationApi.update(id, data),
        onSuccess: (updatedObservation) => {
            queryClient.setQueryData(
                observationKeys.detail(updatedObservation.id),
                updatedObservation
            );
            queryClient.invalidateQueries({ queryKey: observationKeys.lists() });
        },
    });
}

/**
 * Hook to delete an observation.
 */
export function useDeleteObservation(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => observationApi.remove(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: observationKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: observationKeys.lists() });
            // Invalidate related entities
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

// ============================================================================
// File Attachment Hooks
// ============================================================================

/**
 * Hook to attach a file to an observation.
 */
export function useAddFileToObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; fileId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, fileId }) =>
            observationApi.addFile(observationId, fileId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
        },
    });
}

/**
 * Hook to remove a file attachment from an observation.
 */
export function useRemoveFileFromObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; fileId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, fileId }) =>
            observationApi.removeFile(observationId, fileId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
        },
    });
}

// ============================================================================
// Relationship Management Hooks
// ============================================================================
// Note: Sample-observation relationship hooks are in useSamples.ts
// to avoid naming collisions and keep relationship ownership clear.

/**
 * Hook to link an observation to a catalyst.
 */
export function useAddObservationToCatalyst(): UseMutationResult<
    void,
    Error,
    { observationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, catalystId }) =>
            observationApi.addToCatalyst(observationId, catalystId),
        onSuccess: (_, { observationId, catalystId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts', catalystId] });
        },
    });
}

/**
 * Hook to remove an observation from a catalyst.
 */
export function useRemoveObservationFromCatalyst(): UseMutationResult<
    void,
    Error,
    { observationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, catalystId }) =>
            observationApi.removeFromCatalyst(observationId, catalystId),
        onSuccess: (_, { observationId, catalystId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts', catalystId] });
        },
    });
}

// ============================================================================
// Catalyst Relationship Hooks (from Observation side)
// ============================================================================

/**
 * Hook to add a catalyst to an observation.
 */
export function useAddCatalystToObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, catalystId }) =>
            observationApi.addCatalyst(observationId, catalystId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

/**
 * Hook to remove a catalyst from an observation.
 */
export function useRemoveCatalystFromObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, catalystId }) =>
            observationApi.removeCatalyst(observationId, catalystId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

// ============================================================================
// Sample Relationship Hooks (from Observation side)
// ============================================================================

/**
 * Hook to add a sample to an observation.
 */
export function useAddSampleToObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, sampleId }) =>
            observationApi.addSample(observationId, sampleId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

/**
 * Hook to remove a sample from an observation.
 */
export function useRemoveSampleFromObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, sampleId }) =>
            observationApi.removeSample(observationId, sampleId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

// ============================================================================
// User Relationship Hooks
// ============================================================================

/**
 * Hook to add a user to an observation.
 */
export function useAddUserToObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, userId }) =>
            observationApi.addUser(observationId, userId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
        },
    });
}

/**
 * Hook to remove a user from an observation.
 */
export function useRemoveUserFromObservation(): UseMutationResult<
    void,
    Error,
    { observationId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ observationId, userId }) =>
            observationApi.removeUser(observationId, userId),
        onSuccess: (_, { observationId }) => {
            queryClient.invalidateQueries({
                queryKey: observationKeys.detail(observationId),
            });
        },
    });
}
