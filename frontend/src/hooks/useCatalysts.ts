/**
 * Custom hooks for catalyst operations.
 *
 * Catalysts are the core research artifacts in this system. These hooks provide
 * CRUD operations, inventory management (consume), and relationship management
 * for linking to characterizations, observations, and users.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    catalystApi,
    type Catalyst,
    type CatalystCreate,
    type CatalystUpdate,
    type CatalystListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
export const catalystKeys = {
    all: ['catalysts'] as const,
    lists: () => [...catalystKeys.all, 'list'] as const,
    list: (params?: CatalystListParams) => [...catalystKeys.lists(), params] as const,
    details: () => [...catalystKeys.all, 'detail'] as const,
    detail: (id: number) => [...catalystKeys.details(), id] as const,
};

// ============================================================================
// Basic CRUD Hooks
// ============================================================================

/**
 * Hook to fetch a list of catalysts with optional filtering.
 */
export function useCatalysts(params?: CatalystListParams): UseQueryResult<Catalyst[], Error> {
    return useQuery({
        queryKey: catalystKeys.list(params),
        queryFn: () => catalystApi.list(params),
    });
}

/**
 * Hook to fetch a single catalyst by ID with optional relationship inclusion.
 */
export function useCatalyst(id?: number, include?: string): UseQueryResult<Catalyst, Error> {
    return useQuery({
        queryKey: [...catalystKeys.detail(id!), include],
        queryFn: () => catalystApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new catalyst.
 */
export function useCreateCatalyst(): UseMutationResult<Catalyst, Error, CatalystCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CatalystCreate) => catalystApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

/**
 * Hook to update a catalyst.
 */
export function useUpdateCatalyst(): UseMutationResult<
    Catalyst,
    Error,
    { id: number; data: CatalystUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => catalystApi.update(id, data),
        onSuccess: (updatedCatalyst) => {
            queryClient.setQueryData(
                catalystKeys.detail(updatedCatalyst.id),
                updatedCatalyst
            );
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

/**
 * Hook to delete a catalyst.
 */
export function useDeleteCatalyst(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => catalystApi.remove(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: catalystKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

/**
 * Hook to consume material from a catalyst's inventory.
 */
export function useConsumeCatalyst(): UseMutationResult<
    Catalyst,
    Error,
    { id: number; amount: number | string; notes?: string }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, amount, notes }) => catalystApi.consume(id, amount, notes),
        onSuccess: (updatedCatalyst) => {
            queryClient.setQueryData(catalystKeys.detail(updatedCatalyst.id), updatedCatalyst);
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

// ============================================================================
// Characterization Relationship Hooks
// ============================================================================

/**
 * Hook to add a characterization to a catalyst.
 */
export function useAddCharacterizationToCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; characterizationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, characterizationId }) =>
            catalystApi.addCharacterization(catalystId, characterizationId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['characterizations'] });
        },
    });
}

/**
 * Hook to remove a characterization from a catalyst.
 */
export function useRemoveCharacterizationFromCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; characterizationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, characterizationId }) =>
            catalystApi.removeCharacterization(catalystId, characterizationId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['characterizations'] });
        },
    });
}

// ============================================================================
// Observation Relationship Hooks
// ============================================================================

/**
 * Hook to add an observation to a catalyst.
 */
export function useAddObservationToCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; observationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, observationId }) =>
            catalystApi.addObservation(catalystId, observationId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['observations'] });
        },
    });
}

/**
 * Hook to remove an observation from a catalyst.
 */
export function useRemoveObservationFromCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; observationId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, observationId }) =>
            catalystApi.removeObservation(catalystId, observationId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['observations'] });
        },
    });
}

// ============================================================================
// User Relationship Hooks
// ============================================================================

/**
 * Hook to add a user to a catalyst.
 */
export function useAddUserToCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, userId }) =>
            catalystApi.addUser(catalystId, userId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

/**
 * Hook to remove a user from a catalyst.
 */
export function useRemoveUserFromCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, userId }) =>
            catalystApi.removeUser(catalystId, userId),
        onSuccess: (_, { catalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

// ============================================================================
// Input Catalyst Relationship Hooks
// ============================================================================

/**
 * Hook to add an input catalyst.
 */
export function useAddInputCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; inputCatalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, inputCatalystId }) =>
            catalystApi.addInputCatalyst(catalystId, inputCatalystId),
        onSuccess: (_, { catalystId, inputCatalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(inputCatalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}

/**
 * Hook to remove an input catalyst.
 */
export function useRemoveInputCatalyst(): UseMutationResult<
    void,
    Error,
    { catalystId: number; inputCatalystId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ catalystId, inputCatalystId }) =>
            catalystApi.removeInputCatalyst(catalystId, inputCatalystId),
        onSuccess: (_, { catalystId, inputCatalystId }) => {
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(catalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.detail(inputCatalystId) });
            queryClient.invalidateQueries({ queryKey: catalystKeys.lists() });
        },
    });
}
