/**
 * Custom hooks for sample operations.
 *
 * Samples are prepared portions of catalysts for testing. These hooks provide
 * CRUD operations plus inventory management (consume) and relationship
 * management (link/unlink characterizations and observations).
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    sampleApi,
    type Sample,
    type SampleCreate,
    type SampleUpdate,
    type SampleListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const sampleKeys = {
    all: ['samples'] as const,
    lists: () => [...sampleKeys.all, 'list'] as const,
    list: (params?: SampleListParams) => [...sampleKeys.lists(), params] as const,
    details: () => [...sampleKeys.all, 'detail'] as const,
    detail: (id: number) => [...sampleKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of samples with optional filtering.
 */
export function useSamples(params?: SampleListParams): UseQueryResult<Sample[], Error> {
    return useQuery({
        queryKey: sampleKeys.list(params),
        queryFn: () => sampleApi.list(params),
    });
}

/**
 * Hook to fetch a single sample by ID with optional relationship inclusion.
 */
export function useSample(
    id?: number,
    include?: string
): UseQueryResult<Sample, Error> {
    return useQuery({
        queryKey: [...sampleKeys.detail(id!), include],
        queryFn: () => sampleApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new sample.
 */
export function useCreateSample(): UseMutationResult<Sample, Error, SampleCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SampleCreate) => sampleApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
            // Also invalidate catalysts since they may show sample counts
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

/**
 * Hook to update an existing sample.
 */
export function useUpdateSample(): UseMutationResult<
    Sample,
    Error,
    { id: number; data: SampleUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => sampleApi.update(id, data),
        onSuccess: (updatedSample) => {
            queryClient.setQueryData(sampleKeys.detail(updatedSample.id), updatedSample);
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
        },
    });
}

/**
 * Hook to delete a sample.
 */
export function useDeleteSample(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => sampleApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: sampleKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

/**
 * Hook to consume material from a sample's inventory.
 */
export function useConsumeSample(): UseMutationResult<
    Sample,
    Error,
    { id: number; amount: number | string; notes?: string }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, amount, notes }) => sampleApi.consume(id, amount, notes),
        onSuccess: (updatedSample) => {
            queryClient.setQueryData(sampleKeys.detail(updatedSample.id), updatedSample);
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
        },
    });
}

// ============================================================================
// Relationship Management Hooks
// ============================================================================

/**
 * Hook to link a characterization to a sample.
 */
export function useAddCharacterizationToSample(): UseMutationResult<
    void,
    Error,
    { sampleId: number; characterizationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sampleId, characterizationId }) =>
            sampleApi.addCharacterization(sampleId, characterizationId),
        onSuccess: (_, { sampleId }) => {
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: ['characterizations'] });
        },
    });
}

/**
 * Hook to remove a characterization from a sample.
 */
export function useRemoveCharacterizationFromSample(): UseMutationResult<
    void,
    Error,
    { sampleId: number; characterizationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sampleId, characterizationId }) =>
            sampleApi.removeCharacterization(sampleId, characterizationId),
        onSuccess: (_, { sampleId }) => {
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: ['characterizations'] });
        },
    });
}

/**
 * Hook to link an observation to a sample.
 */
export function useAddObservationToSample(): UseMutationResult<
    void,
    Error,
    { sampleId: number; observationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sampleId, observationId }) =>
            sampleApi.addObservation(sampleId, observationId),
        onSuccess: (_, { sampleId }) => {
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: ['observations'] });
        },
    });
}

/**
 * Hook to remove an observation from a sample.
 */
export function useRemoveObservationFromSample(): UseMutationResult<
    void,
    Error,
    { sampleId: number; observationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sampleId, observationId }) =>
            sampleApi.removeObservation(sampleId, observationId),
        onSuccess: (_, { sampleId }) => {
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: ['observations'] });
        },
    });
}