/**
 * Custom hooks for waveform operations.
 *
 * Waveforms define electrical signal parameters used in plasma experiments.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    waveformApi,
    type Waveform,
    type WaveformCreate,
    type WaveformUpdate,
    type WaveformListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const waveformKeys = {
    all: ['waveforms'] as const,
    lists: () => [...waveformKeys.all, 'list'] as const,
    list: (params?: WaveformListParams) => [...waveformKeys.lists(), params] as const,
    details: () => [...waveformKeys.all, 'detail'] as const,
    detail: (id: number) => [...waveformKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of waveforms with optional filtering.
 */
export function useWaveforms(params?: WaveformListParams): UseQueryResult<Waveform[], Error> {
    return useQuery({
        queryKey: waveformKeys.list(params),
        queryFn: () => waveformApi.list(params),
    });
}

/**
 * Hook to fetch a single waveform by ID.
 */
export function useWaveform(
    id?: number,
    include?: string
): UseQueryResult<Waveform, Error> {
    return useQuery({
        queryKey: [...waveformKeys.detail(id!), include],
        queryFn: () => waveformApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new waveform.
 */
export function useCreateWaveform(): UseMutationResult<Waveform, Error, WaveformCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: WaveformCreate) => waveformApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: waveformKeys.lists() });
        },
    });
}

/**
 * Hook to update a waveform.
 */
export function useUpdateWaveform(): UseMutationResult<
    Waveform,
    Error,
    { id: number; data: WaveformUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => waveformApi.update(id, data),
        onSuccess: (updatedWaveform) => {
            queryClient.setQueryData(waveformKeys.detail(updatedWaveform.id), updatedWaveform);
            queryClient.invalidateQueries({ queryKey: waveformKeys.lists() });
        },
    });
}

/**
 * Hook to delete a waveform.
 */
export function useDeleteWaveform(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => waveformApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: waveformKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: waveformKeys.lists() });
        },
    });
}