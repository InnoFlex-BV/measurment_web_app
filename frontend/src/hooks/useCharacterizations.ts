/**
 * Custom hooks for characterization operations.
 *
 * Characterizations are analytical measurements (XRD, BET, TEM, etc.) that can
 * be linked to catalysts and samples. These hooks provide CRUD operations plus
 * relationship management for linking to catalysts and samples.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    characterizationApi,
    type Characterization,
    type CharacterizationCreate,
    type CharacterizationUpdate,
    type CharacterizationListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const characterizationKeys = {
    all: ['characterizations'] as const,
    lists: () => [...characterizationKeys.all, 'list'] as const,
    list: (params?: CharacterizationListParams) => [...characterizationKeys.lists(), params] as const,
    details: () => [...characterizationKeys.all, 'detail'] as const,
    detail: (id: number) => [...characterizationKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of characterizations with optional filtering.
 */
export function useCharacterizations(
    params?: CharacterizationListParams
): UseQueryResult<Characterization[], Error> {
    return useQuery({
        queryKey: characterizationKeys.list(params),
        queryFn: () => characterizationApi.list(params),
    });
}

/**
 * Hook to fetch a single characterization by ID with optional relationship inclusion.
 */
export function useCharacterization(
    id?: number,
    include?: string
): UseQueryResult<Characterization, Error> {
    return useQuery({
        queryKey: [...characterizationKeys.detail(id!), include],
        queryFn: () => characterizationApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new characterization.
 */
export function useCreateCharacterization(): UseMutationResult<
    Characterization,
    Error,
    CharacterizationCreate
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CharacterizationCreate) => characterizationApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: characterizationKeys.lists() });
        },
    });
}

/**
 * Hook to update an existing characterization.
 */
export function useUpdateCharacterization(): UseMutationResult<
    Characterization,
    Error,
    { id: number; data: CharacterizationUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => characterizationApi.update(id, data),
        onSuccess: (updatedCharacterization) => {
            queryClient.setQueryData(
                characterizationKeys.detail(updatedCharacterization.id),
                updatedCharacterization
            );
            queryClient.invalidateQueries({ queryKey: characterizationKeys.lists() });
        },
    });
}

/**
 * Hook to delete a characterization.
 */
export function useDeleteCharacterization(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => characterizationApi.remove(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: characterizationKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: characterizationKeys.lists() });
            // Invalidate related entities that may display characterization counts
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

// ============================================================================
// Relationship Management Hooks
// ============================================================================
// Note: Sample-characterization relationship hooks are in useSamples.ts
// to avoid naming collisions and keep relationship ownership clear.

/**
 * Hook to link a characterization to a catalyst.
 */
export function useAddCharacterizationToCatalyst(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, catalystId }) =>
            characterizationApi.addToCatalyst(characterizationId, catalystId),
        onSuccess: (_, { characterizationId, catalystId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts', catalystId] });
        },
    });
}

/**
 * Hook to remove a characterization from a catalyst.
 */
export function useRemoveCharacterizationFromCatalyst(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, catalystId }) =>
            characterizationApi.removeFromCatalyst(characterizationId, catalystId),
        onSuccess: (_, { characterizationId, catalystId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts', catalystId] });
        },
    });
}

// ============================================================================
// Catalyst Relationship Hooks (from Characterization side)
// ============================================================================

/**
 * Hook to add a catalyst to a characterization.
 */
export function useAddCatalystToCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, catalystId }) =>
            characterizationApi.addCatalyst(characterizationId, catalystId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

/**
 * Hook to remove a catalyst from a characterization.
 */
export function useRemoveCatalystFromCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; catalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, catalystId }) =>
            characterizationApi.removeCatalyst(characterizationId, catalystId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

// ============================================================================
// Sample Relationship Hooks (from Characterization side)
// ============================================================================

/**
 * Hook to add a sample to a characterization.
 */
export function useAddSampleToCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, sampleId }) =>
            characterizationApi.addSample(characterizationId, sampleId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

/**
 * Hook to remove a sample from a characterization.
 */
export function useRemoveSampleFromCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, sampleId }) =>
            characterizationApi.removeSample(characterizationId, sampleId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
            queryClient.invalidateQueries({ queryKey: ['samples'] });
        },
    });
}

// ============================================================================
// User Relationship Hooks
// ============================================================================

/**
 * Hook to add a user to a characterization.
 */
export function useAddUserToCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, userId }) =>
            characterizationApi.addUser(characterizationId, userId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
        },
    });
}

/**
 * Hook to remove a user from a characterization.
 */
export function useRemoveUserFromCharacterization(): UseMutationResult<
    void,
    Error,
    { characterizationId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterizationId, userId }) =>
            characterizationApi.removeUser(characterizationId, userId),
        onSuccess: (_, { characterizationId }) => {
            queryClient.invalidateQueries({
                queryKey: characterizationKeys.detail(characterizationId),
            });
        },
    });
}
