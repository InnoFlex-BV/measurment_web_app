import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { catalystApi, type Catalyst, type CatalystCreate, type CatalystUpdate, type CatalystListParams } from '@/services/api';

export function useCatalysts(params?: CatalystListParams): UseQueryResult<Catalyst[], Error> {
    return useQuery({
        queryKey: ['catalysts', params],
        queryFn: () => catalystApi.list(params),
    });
}

export function useCatalyst(id?: number, include?: string): UseQueryResult<Catalyst, Error> {
    return useQuery({
        queryKey: ['catalysts', id, include],
        queryFn: () => catalystApi.get(id!, include),
        enabled: !!id,
    });
}

export function useCreateCatalyst(): UseMutationResult<Catalyst, Error, CatalystCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CatalystCreate) => catalystApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

export function useUpdateCatalyst(): UseMutationResult<Catalyst, Error, { id: number; data: CatalystUpdate }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CatalystUpdate }) =>
            catalystApi.update(id, data),
        onSuccess: (updatedCatalyst: Catalyst) => {
            queryClient.setQueryData(['catalysts', updatedCatalyst.id], updatedCatalyst);
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

export function useDeleteCatalyst(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => catalystApi.remove(id),
        onSuccess: (_, deletedId: number) => {
            queryClient.removeQueries({ queryKey: ['catalysts', deletedId] });
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}

export function useConsumeCatalyst(): UseMutationResult<Catalyst, Error, { id: number; amount: number | string; notes?: string }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, amount, notes }: { id: number; amount: number | string; notes?: string }) =>
            catalystApi.consume(id, amount, notes),
        onSuccess: (updatedCatalyst: Catalyst) => {
            queryClient.setQueryData(['catalysts', updatedCatalyst.id], updatedCatalyst);
            queryClient.invalidateQueries({ queryKey: ['catalysts'] });
        },
    });
}
