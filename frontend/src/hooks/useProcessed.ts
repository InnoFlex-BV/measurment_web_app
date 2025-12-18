/**
 * Custom hooks for processed results operations.
 *
 * Processed results store calculated metrics from experiments:
 * - DRE (Decomposition/Removal Efficiency) - percentage
 * - EY (Energy Yield) - g/kWh or mol/kWh
 *
 * These hooks provide CRUD operations with React Query caching.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    processedApi,
    type Processed,
    type ProcessedCreate,
    type ProcessedUpdate,
    type ProcessedListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const processedKeys = {
    all: ['processed'] as const,
    lists: () => [...processedKeys.all, 'list'] as const,
    list: (params?: ProcessedListParams) => [...processedKeys.lists(), params] as const,
    details: () => [...processedKeys.all, 'detail'] as const,
    detail: (id: number) => [...processedKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of processed results with optional filtering.
 *
 * @param params - Optional filter parameters
 * @returns Query result with processed results array
 *
 * @example
 * // Get all processed results
 * const { data: results } = useProcessedResults();
 *
 * @example
 * // Get only complete results (both DRE and EY recorded)
 * const { data: complete } = useProcessedResults({ complete_only: true });
 *
 * @example
 * // Get high-efficiency results
 * const { data: highDRE } = useProcessedResults({ min_dre: 80 });
 */
export function useProcessedResults(
    params?: ProcessedListParams
): UseQueryResult<Processed[], Error> {
    return useQuery({
        queryKey: processedKeys.list(params),
        queryFn: () => processedApi.list(params),
    });
}

/**
 * Hook to fetch a single processed result by ID.
 *
 * @param id - Processed result ID (undefined to disable query)
 * @param include - Comma-separated relationships to include
 * @returns Query result with processed result
 *
 * @example
 * const { data: result } = useProcessedResult(1, 'experiments');
 */
export function useProcessedResult(
    id?: number,
    include?: string
): UseQueryResult<Processed, Error> {
    return useQuery({
        queryKey: [...processedKeys.detail(id!), include],
        queryFn: () => processedApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new processed result.
 *
 * Automatically invalidates the processed list cache on success.
 *
 * @returns Mutation result for creating processed results
 *
 * @example
 * const createMutation = useCreateProcessed();
 *
 * const handleSubmit = async (data) => {
 *     const result = await createMutation.mutateAsync({
 *         dre: 85.5,
 *         ey: 12.3,
 *     });
 *     navigate(`/processed/${result.id}`);
 * };
 */
export function useCreateProcessed(): UseMutationResult<
    Processed,
    Error,
    ProcessedCreate
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ProcessedCreate) => processedApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: processedKeys.lists() });
            // Also invalidate experiments since they may reference processed results
            queryClient.invalidateQueries({ queryKey: ['experiments'] });
        },
    });
}

/**
 * Hook to update an existing processed result.
 *
 * Automatically updates the cache with the new data.
 *
 * @returns Mutation result for updating processed results
 *
 * @example
 * const updateMutation = useUpdateProcessed();
 *
 * const handleUpdate = async (id, data) => {
 *     await updateMutation.mutateAsync({ id, data: { dre: 90.0 } });
 * };
 */
export function useUpdateProcessed(): UseMutationResult<
    Processed,
    Error,
    { id: number; data: ProcessedUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => processedApi.update(id, data),
        onSuccess: (updatedResult) => {
            // Update the detail cache
            queryClient.setQueryData(
                processedKeys.detail(updatedResult.id),
                updatedResult
            );
            // Invalidate lists to reflect changes
            queryClient.invalidateQueries({ queryKey: processedKeys.lists() });
        },
    });
}

/**
 * Hook to delete a processed result.
 *
 * Automatically invalidates caches on success.
 *
 * @returns Mutation result for deleting processed results
 *
 * @example
 * const deleteMutation = useDeleteProcessed();
 *
 * const handleDelete = async (id) => {
 *     if (confirm('Delete this result?')) {
 *         await deleteMutation.mutateAsync(id);
 *         navigate('/processed');
 *     }
 * };
 */
export function useDeleteProcessed(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => processedApi.delete(id),
        onSuccess: (_, deletedId) => {
            // Remove from detail cache
            queryClient.removeQueries({ queryKey: processedKeys.detail(deletedId) });
            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: processedKeys.lists() });
            // Invalidate experiments since they may have referenced this
            queryClient.invalidateQueries({ queryKey: ['experiments'] });
        },
    });
}