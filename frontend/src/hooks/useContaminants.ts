/**
 * Custom hooks for contaminant operations.
 *
 * Contaminants are the target compounds that experiments aim to remove
 * or decompose.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    contaminantApi,
    type Contaminant,
    type ContaminantCreate,
    type ContaminantUpdate,
    type ContaminantListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const contaminantKeys = {
    all: ['contaminants'] as const,
    lists: () => [...contaminantKeys.all, 'list'] as const,
    list: (params?: ContaminantListParams) => [...contaminantKeys.lists(), params] as const,
    details: () => [...contaminantKeys.all, 'detail'] as const,
    detail: (id: number) => [...contaminantKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of contaminants with optional filtering.
 */
export function useContaminants(params?: ContaminantListParams): UseQueryResult<Contaminant[], Error> {
    return useQuery({
        queryKey: contaminantKeys.list(params),
        queryFn: () => contaminantApi.list(params),
    });
}

/**
 * Hook to fetch a single contaminant by ID.
 */
export function useContaminant(
    id?: number,
    include?: string
): UseQueryResult<Contaminant, Error> {
    return useQuery({
        queryKey: [...contaminantKeys.detail(id!), include],
        queryFn: () => contaminantApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new contaminant.
 */
export function useCreateContaminant(): UseMutationResult<Contaminant, Error, ContaminantCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ContaminantCreate) => contaminantApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contaminantKeys.lists() });
        },
    });
}

/**
 * Hook to update a contaminant.
 */
export function useUpdateContaminant(): UseMutationResult<
    Contaminant,
    Error,
    { id: number; data: ContaminantUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => contaminantApi.update(id, data),
        onSuccess: (updatedContaminant) => {
            queryClient.setQueryData(contaminantKeys.detail(updatedContaminant.id), updatedContaminant);
            queryClient.invalidateQueries({ queryKey: contaminantKeys.lists() });
        },
    });
}

/**
 * Hook to delete a contaminant.
 */
export function useDeleteContaminant(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => contaminantApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: contaminantKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: contaminantKeys.lists() });
        },
    });
}