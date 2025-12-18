/**
 * Custom hooks for analyzer operations.
 *
 * Analyzers are instruments used to measure experimental outputs.
 * Supports polymorphic handling of FTIR and OES analyzer subtypes.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    analyzerApi,
    type Analyzer,
    type FTIRAnalyzer,
    type OESAnalyzer,
    type AnalyzerCreate,
    type AnalyzerUpdate,
    type AnalyzerListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const analyzerKeys = {
    all: ['analyzers'] as const,
    lists: () => [...analyzerKeys.all, 'list'] as const,
    list: (params?: AnalyzerListParams) => [...analyzerKeys.lists(), params] as const,
    ftirLists: () => [...analyzerKeys.all, 'ftir', 'list'] as const,
    ftirList: (params?: Omit<AnalyzerListParams, 'analyzer_type'>) => [...analyzerKeys.ftirLists(), params] as const,
    oesLists: () => [...analyzerKeys.all, 'oes', 'list'] as const,
    oesList: (params?: Omit<AnalyzerListParams, 'analyzer_type'>) => [...analyzerKeys.oesLists(), params] as const,
    details: () => [...analyzerKeys.all, 'detail'] as const,
    detail: (id: number) => [...analyzerKeys.details(), id] as const,
};

/**
 * Hook to fetch all analyzers (FTIR and OES) with optional filtering.
 */
export function useAnalyzers(params?: AnalyzerListParams): UseQueryResult<Analyzer[], Error> {
    return useQuery({
        queryKey: analyzerKeys.list(params),
        queryFn: () => analyzerApi.list(params),
    });
}

/**
 * Hook to fetch FTIR analyzers only.
 */
export function useFTIRAnalyzers(
    params?: Omit<AnalyzerListParams, 'analyzer_type'>
): UseQueryResult<FTIRAnalyzer[], Error> {
    return useQuery({
        queryKey: analyzerKeys.ftirList(params),
        queryFn: () => analyzerApi.listFTIR(params),
    });
}

/**
 * Hook to fetch OES analyzers only.
 */
export function useOESAnalyzers(
    params?: Omit<AnalyzerListParams, 'analyzer_type'>
): UseQueryResult<OESAnalyzer[], Error> {
    return useQuery({
        queryKey: analyzerKeys.oesList(params),
        queryFn: () => analyzerApi.listOES(params),
    });
}

/**
 * Hook to fetch a single analyzer by ID.
 * Returns the full polymorphic type with all type-specific fields.
 */
export function useAnalyzer(
    id?: number,
    include?: string
): UseQueryResult<Analyzer, Error> {
    return useQuery({
        queryKey: [...analyzerKeys.detail(id!), include],
        queryFn: () => analyzerApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new analyzer.
 * The analyzer_type in the data determines which subtype is created.
 */
export function useCreateAnalyzer(): UseMutationResult<Analyzer, Error, AnalyzerCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AnalyzerCreate) => analyzerApi.create(data),
        onSuccess: (newAnalyzer) => {
            // Invalidate all analyzer lists (including type-specific)
            queryClient.invalidateQueries({ queryKey: analyzerKeys.lists() });
            if (newAnalyzer.analyzer_type === 'ftir') {
                queryClient.invalidateQueries({ queryKey: analyzerKeys.ftirLists() });
            } else {
                queryClient.invalidateQueries({ queryKey: analyzerKeys.oesLists() });
            }
        },
    });
}

/**
 * Hook to update an analyzer.
 */
export function useUpdateAnalyzer(): UseMutationResult<
    Analyzer,
    Error,
    { id: number; data: AnalyzerUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => analyzerApi.update(id, data),
        onSuccess: (updatedAnalyzer) => {
            queryClient.setQueryData(analyzerKeys.detail(updatedAnalyzer.id), updatedAnalyzer);
            queryClient.invalidateQueries({ queryKey: analyzerKeys.lists() });
            // Also invalidate type-specific lists
            if (updatedAnalyzer.analyzer_type === 'ftir') {
                queryClient.invalidateQueries({ queryKey: analyzerKeys.ftirLists() });
            } else {
                queryClient.invalidateQueries({ queryKey: analyzerKeys.oesLists() });
            }
        },
    });
}

/**
 * Hook to delete an analyzer.
 */
export function useDeleteAnalyzer(): UseMutationResult<void, Error, { id: number; force?: boolean }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force }) => analyzerApi.remove(id, force),
        onSuccess: (_, { id }) => {
            queryClient.removeQueries({ queryKey: analyzerKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: analyzerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: analyzerKeys.ftirLists() });
            queryClient.invalidateQueries({ queryKey: analyzerKeys.oesLists() });
        },
    });
}