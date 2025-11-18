import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { chemicalApi, type Chemical, type ChemicalCreate, type ChemicalUpdate, type ChemicalListParams } from '@/services/api';

export function useChemicals(params?: ChemicalListParams): UseQueryResult<Chemical[], Error> {
    return useQuery({
        queryKey: ['chemicals', params],
        queryFn: () => chemicalApi.list(params),
    });
}

export function useChemical(id?: number): UseQueryResult<Chemical, Error> {
    return useQuery({
        queryKey: ['chemicals', id],
        queryFn: () => chemicalApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateChemical(): UseMutationResult<Chemical, Error, ChemicalCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ChemicalCreate) => chemicalApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chemicals'] });
        },
    });
}

export function useUpdateChemical(): UseMutationResult<Chemical, Error, { id: number; data: ChemicalUpdate }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ChemicalUpdate }) =>
            chemicalApi.update(id, data),
        onSuccess: (updatedChemical: Chemical) => {
            queryClient.setQueryData(['chemicals', updatedChemical.id], updatedChemical);
            queryClient.invalidateQueries({ queryKey: ['chemicals'] });
        },
    });
}

export function useDeleteChemical(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => chemicalApi.remove(id),
        onSuccess: (_, deletedId: number) => {
            queryClient.removeQueries({ queryKey: ['chemicals', deletedId] });
            queryClient.invalidateQueries({ queryKey: ['chemicals'] });
        },
    });
}
