import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { supportApi, type Support, type SupportCreate, type SupportUpdate, type SupportListParams } from '@/services/api';

export function useSupports(params?: SupportListParams): UseQueryResult<Support[], Error> {
    return useQuery({
        queryKey: ['supports', params],
        queryFn: () => supportApi.list(params),
    });
}

export function useSupport(id?: number): UseQueryResult<Support, Error> {
    return useQuery({
        queryKey: ['supports', id],
        queryFn: () => supportApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateSupport(): UseMutationResult<Support, Error, SupportCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SupportCreate) => supportApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supports'] });
        },
    });
}

export function useUpdateSupport(): UseMutationResult<Support, Error, { id: number; data: SupportUpdate }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SupportUpdate }) =>
            supportApi.update(id, data),
        onSuccess: (updatedSupport: Support) => {
            queryClient.setQueryData(['supports', updatedSupport.id], updatedSupport);
            queryClient.invalidateQueries({ queryKey: ['supports'] });
        },
    });
}

export function useDeleteSupport(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => supportApi.remove(id),
        onSuccess: (_, deletedId: number) => {
            queryClient.removeQueries({ queryKey: ['supports', deletedId] });
            queryClient.invalidateQueries({ queryKey: ['supports'] });
        },
    });
}
