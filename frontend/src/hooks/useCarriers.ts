/**
 * Custom hooks for carrier operations.
 *
 * Carriers are the gases used as the main flow in experiments, carrying
 * the contaminants through the reactor.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    carrierApi,
    type Carrier,
    type CarrierCreate,
    type CarrierUpdate,
    type CarrierListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const carrierKeys = {
    all: ['carriers'] as const,
    lists: () => [...carrierKeys.all, 'list'] as const,
    list: (params?: CarrierListParams) => [...carrierKeys.lists(), params] as const,
    details: () => [...carrierKeys.all, 'detail'] as const,
    detail: (id: number) => [...carrierKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of carriers with optional filtering.
 */
export function useCarriers(params?: CarrierListParams): UseQueryResult<Carrier[], Error> {
    return useQuery({
        queryKey: carrierKeys.list(params),
        queryFn: () => carrierApi.list(params),
    });
}

/**
 * Hook to fetch a single carrier by ID.
 */
export function useCarrier(
    id?: number,
    include?: string
): UseQueryResult<Carrier, Error> {
    return useQuery({
        queryKey: [...carrierKeys.detail(id!), include],
        queryFn: () => carrierApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new carrier.
 */
export function useCreateCarrier(): UseMutationResult<Carrier, Error, CarrierCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CarrierCreate) => carrierApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: carrierKeys.lists() });
        },
    });
}

/**
 * Hook to update a carrier.
 */
export function useUpdateCarrier(): UseMutationResult<
    Carrier,
    Error,
    { id: number; data: CarrierUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => carrierApi.update(id, data),
        onSuccess: (updatedCarrier) => {
            queryClient.setQueryData(carrierKeys.detail(updatedCarrier.id), updatedCarrier);
            queryClient.invalidateQueries({ queryKey: carrierKeys.lists() });
        },
    });
}

/**
 * Hook to delete a carrier.
 */
export function useDeleteCarrier(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => carrierApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: carrierKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: carrierKeys.lists() });
        },
    });
}