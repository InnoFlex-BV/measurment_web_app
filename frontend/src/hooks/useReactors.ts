/**
 * Custom hooks for reactor operations.
 *
 * Reactors are the vessels where catalytic reactions and plasma experiments
 * are conducted.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    reactorApi,
    type Reactor,
    type ReactorCreate,
    type ReactorUpdate,
    type ReactorListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const reactorKeys = {
    all: ['reactors'] as const,
    lists: () => [...reactorKeys.all, 'list'] as const,
    list: (params?: ReactorListParams) => [...reactorKeys.lists(), params] as const,
    details: () => [...reactorKeys.all, 'detail'] as const,
    detail: (id: number) => [...reactorKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of reactors with optional filtering.
 */
export function useReactors(params?: ReactorListParams): UseQueryResult<Reactor[], Error> {
    return useQuery({
        queryKey: reactorKeys.list(params),
        queryFn: () => reactorApi.list(params),
    });
}

/**
 * Hook to fetch a single reactor by ID.
 */
export function useReactor(
    id?: number,
    include?: string
): UseQueryResult<Reactor, Error> {
    return useQuery({
        queryKey: [...reactorKeys.detail(id!), include],
        queryFn: () => reactorApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new reactor.
 */
export function useCreateReactor(): UseMutationResult<Reactor, Error, ReactorCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ReactorCreate) => reactorApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reactorKeys.lists() });
        },
    });
}

/**
 * Hook to update a reactor.
 */
export function useUpdateReactor(): UseMutationResult<
    Reactor,
    Error,
    { id: number; data: ReactorUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => reactorApi.update(id, data),
        onSuccess: (updatedReactor) => {
            queryClient.setQueryData(reactorKeys.detail(updatedReactor.id), updatedReactor);
            queryClient.invalidateQueries({ queryKey: reactorKeys.lists() });
        },
    });
}

/**
 * Hook to delete a reactor.
 */
export function useDeleteReactor(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => reactorApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: reactorKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: reactorKeys.lists() });
        },
    });
}