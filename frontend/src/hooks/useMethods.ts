import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { methodApi, type Method, type MethodCreate, type MethodUpdate, type MethodListParams } from '@/services/api';

export function useMethods(params?: MethodListParams): UseQueryResult<Method[], Error> {
    return useQuery({
        queryKey: ['methods', params],
        queryFn: () => methodApi.list(params),
    });
}

export function useMethod(id?: number, include?: string): UseQueryResult<Method, Error> {
    return useQuery({
        queryKey: ['methods', id, include],
        queryFn: () => methodApi.get(id!, include),
        enabled: !!id,
    });
}

export function useCreateMethod(): UseMutationResult<Method, Error, MethodCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: MethodCreate) => methodApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['methods'] });
        },
    });
}

export function useUpdateMethod(): UseMutationResult<Method, Error, { id: number; data: MethodUpdate }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: MethodUpdate }) =>
            methodApi.update(id, data),
        onSuccess: (updatedMethod: Method) => {
            queryClient.setQueryData(['methods', updatedMethod.id], updatedMethod);
            queryClient.invalidateQueries({ queryKey: ['methods'] });
        },
    });
}

export function useDeleteMethod(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => methodApi.remove(id),
        onSuccess: (_, deletedId: number) => {
            queryClient.removeQueries({ queryKey: ['methods', deletedId] });
            queryClient.invalidateQueries({ queryKey: ['methods'] });
        },
    });
}
