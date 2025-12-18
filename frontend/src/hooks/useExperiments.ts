/**
 * Custom hooks for experiment operations.
 *
 * Experiments are the core data collection entities, recording conditions
 * and results of catalytic testing. Supports polymorphic handling of
 * Plasma, Photocatalysis, and Misc experiment subtypes.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    experimentApi,
    type Experiment,
    type PlasmaExperiment,
    type PhotocatalysisExperiment,
    type MiscExperiment,
    type ExperimentCreate,
    type ExperimentUpdate,
    type ExperimentListParams,
    type ExperimentType,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const experimentKeys = {
    all: ['experiments'] as const,
    lists: () => [...experimentKeys.all, 'list'] as const,
    list: (params?: ExperimentListParams) => [...experimentKeys.lists(), params] as const,
    plasmaLists: () => [...experimentKeys.all, 'plasma', 'list'] as const,
    plasmaList: (params?: Omit<ExperimentListParams, 'experiment_type'>) => [...experimentKeys.plasmaLists(), params] as const,
    photocatalysisLists: () => [...experimentKeys.all, 'photocatalysis', 'list'] as const,
    photocatalysisList: (params?: Omit<ExperimentListParams, 'experiment_type'>) => [...experimentKeys.photocatalysisLists(), params] as const,
    miscLists: () => [...experimentKeys.all, 'misc', 'list'] as const,
    miscList: (params?: Omit<ExperimentListParams, 'experiment_type'>) => [...experimentKeys.miscLists(), params] as const,
    details: () => [...experimentKeys.all, 'detail'] as const,
    detail: (id: number) => [...experimentKeys.details(), id] as const,
};

// Cross-entity keys for relationship invalidation
const sampleKeys = {
    all: ['samples'] as const,
    lists: () => [...sampleKeys.all, 'list'] as const,
    details: () => [...sampleKeys.all, 'detail'] as const,
    detail: (id: number) => [...sampleKeys.details(), id] as const,
};

const groupKeys = {
    all: ['groups'] as const,
    lists: () => [...groupKeys.all, 'list'] as const,
    details: () => [...groupKeys.all, 'detail'] as const,
    detail: (id: number) => [...groupKeys.details(), id] as const,
};

const contaminantKeys = {
    all: ['contaminants'] as const,
    lists: () => [...contaminantKeys.all, 'list'] as const,
    details: () => [...contaminantKeys.all, 'detail'] as const,
    detail: (id: number) => [...contaminantKeys.details(), id] as const,
};

const carrierKeys = {
    all: ['carriers'] as const,
    lists: () => [...carrierKeys.all, 'list'] as const,
    details: () => [...carrierKeys.all, 'detail'] as const,
    detail: (id: number) => [...carrierKeys.details(), id] as const,
};

// ============================================================================
// List Hooks
// ============================================================================

/**
 * Hook to fetch all experiments with optional filtering.
 */
export function useExperiments(params?: ExperimentListParams): UseQueryResult<Experiment[], Error> {
    return useQuery({
        queryKey: experimentKeys.list(params),
        queryFn: () => experimentApi.list(params),
    });
}

/**
 * Hook to fetch plasma experiments only.
 */
export function usePlasmaExperiments(
    params?: Omit<ExperimentListParams, 'experiment_type'>
): UseQueryResult<PlasmaExperiment[], Error> {
    return useQuery({
        queryKey: experimentKeys.plasmaList(params),
        queryFn: () => experimentApi.listPlasma(params),
    });
}

/**
 * Hook to fetch photocatalysis experiments only.
 */
export function usePhotocatalysisExperiments(
    params?: Omit<ExperimentListParams, 'experiment_type'>
): UseQueryResult<PhotocatalysisExperiment[], Error> {
    return useQuery({
        queryKey: experimentKeys.photocatalysisList(params),
        queryFn: () => experimentApi.listPhotocatalysis(params),
    });
}

/**
 * Hook to fetch misc experiments only.
 */
export function useMiscExperiments(
    params?: Omit<ExperimentListParams, 'experiment_type'>
): UseQueryResult<MiscExperiment[], Error> {
    return useQuery({
        queryKey: experimentKeys.miscList(params),
        queryFn: () => experimentApi.listMisc(params),
    });
}

/**
 * Hook to fetch experiments by type.
 */
export function useExperimentsByType(
    experimentType: ExperimentType,
    params?: Omit<ExperimentListParams, 'experiment_type'>
): UseQueryResult<Experiment[], Error> {
    const queryKey = (() => {
        switch (experimentType) {
            case 'plasma':
                return experimentKeys.plasmaList(params);
            case 'photocatalysis':
                return experimentKeys.photocatalysisList(params);
            case 'misc':
                return experimentKeys.miscList(params);
        }
    })();

    return useQuery({
        queryKey,
        queryFn: () => experimentApi.listByType(experimentType, params),
    });
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Hook to fetch a single experiment by ID.
 * Returns the full polymorphic type with all type-specific fields.
 */
export function useExperiment(
    id?: number,
    include?: string
): UseQueryResult<Experiment, Error> {
    return useQuery({
        queryKey: [...experimentKeys.detail(id!), include],
        queryFn: () => experimentApi.get(id!, include),
        enabled: !!id,
    });
}

// ============================================================================
// CRUD Mutations
// ============================================================================

/**
 * Helper to invalidate all experiment lists (including type-specific).
 */
function invalidateAllExperimentLists(
    queryClient: ReturnType<typeof useQueryClient>,
    experimentType?: ExperimentType
) {
    queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });

    if (!experimentType || experimentType === 'plasma') {
        queryClient.invalidateQueries({ queryKey: experimentKeys.plasmaLists() });
    }
    if (!experimentType || experimentType === 'photocatalysis') {
        queryClient.invalidateQueries({ queryKey: experimentKeys.photocatalysisLists() });
    }
    if (!experimentType || experimentType === 'misc') {
        queryClient.invalidateQueries({ queryKey: experimentKeys.miscLists() });
    }
}

/**
 * Hook to create a new experiment.
 * The experiment_type in the data determines which subtype is created.
 */
export function useCreateExperiment(): UseMutationResult<Experiment, Error, ExperimentCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ExperimentCreate) => experimentApi.create(data),
        onSuccess: (newExperiment) => {
            invalidateAllExperimentLists(queryClient, newExperiment.experiment_type);
        },
    });
}

/**
 * Hook to update an experiment.
 */
export function useUpdateExperiment(): UseMutationResult<
    Experiment,
    Error,
    { id: number; data: ExperimentUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => experimentApi.update(id, data),
        onSuccess: (updatedExperiment) => {
            queryClient.setQueryData(experimentKeys.detail(updatedExperiment.id), updatedExperiment);
            invalidateAllExperimentLists(queryClient, updatedExperiment.experiment_type);
        },
    });
}

/**
 * Hook to delete an experiment.
 */
export function useDeleteExperiment(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => experimentApi.remove(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: experimentKeys.detail(id) });
            invalidateAllExperimentLists(queryClient);
        },
    });
}

// ============================================================================
// Sample Relationship Hooks
// ============================================================================

/**
 * Hook to add a sample to an experiment.
 */
export function useAddSampleToExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, sampleId }) =>
            experimentApi.addSample(experimentId, sampleId),
        onSuccess: (_, { experimentId, sampleId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
        },
    });
}

/**
 * Hook to remove a sample from an experiment.
 */
export function useRemoveSampleFromExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; sampleId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, sampleId }) =>
            experimentApi.removeSample(experimentId, sampleId),
        onSuccess: (_, { experimentId, sampleId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: sampleKeys.detail(sampleId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
        },
    });
}

// ============================================================================
// Group Relationship Hooks (from Experiment perspective)
// ============================================================================

/**
 * Hook to add a group to an experiment.
 * Note: Use useAddExperimentToGroup from useGroups for group-centric operations.
 */
export function useAddGroupToExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; groupId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, groupId }) =>
            experimentApi.addToGroup(experimentId, groupId),
        onSuccess: (_, { experimentId, groupId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        },
    });
}

/**
 * Hook to remove a group from an experiment.
 * Note: Use useRemoveExperimentFromGroup from useGroups for group-centric operations.
 */
export function useRemoveGroupFromExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; groupId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, groupId }) =>
            experimentApi.removeFromGroup(experimentId, groupId),
        onSuccess: (_, { experimentId, groupId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        },
    });
}

// ============================================================================
// User Relationship Hooks
// ============================================================================

/**
 * Hook to add a user to an experiment.
 */
export function useAddUserToExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, userId }) =>
            experimentApi.addUser(experimentId, userId),
        onSuccess: (_, { experimentId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to remove a user from an experiment.
 */
export function useRemoveUserFromExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; userId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, userId }) =>
            experimentApi.removeUser(experimentId, userId),
        onSuccess: (_, { experimentId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

// ============================================================================
// Contaminant Relationship Hooks (with ppm)
// ============================================================================

/**
 * Hook to add a contaminant to an experiment.
 */
export function useAddContaminantToExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; contaminantId: number; ppm?: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, contaminantId, ppm }) =>
            experimentApi.addContaminant(experimentId, contaminantId, ppm),
        onSuccess: (_, { experimentId, contaminantId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: contaminantKeys.detail(contaminantId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to remove a contaminant from an experiment.
 */
export function useRemoveContaminantFromExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; contaminantId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, contaminantId }) =>
            experimentApi.removeContaminant(experimentId, contaminantId),
        onSuccess: (_, { experimentId, contaminantId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: contaminantKeys.detail(contaminantId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to update contaminant ppm for an experiment.
 */
export function useUpdateExperimentContaminantPpm(): UseMutationResult<
    void,
    Error,
    { experimentId: number; contaminantId: number; ppm: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, contaminantId, ppm }) =>
            experimentApi.updateContaminantPpm(experimentId, contaminantId, ppm),
        onSuccess: (_, { experimentId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

// ============================================================================
// Carrier Relationship Hooks (with ratio)
// ============================================================================

/**
 * Hook to add a carrier to an experiment.
 */
export function useAddCarrierToExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; carrierId: number; ratio?: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, carrierId, ratio }) =>
            experimentApi.addCarrier(experimentId, carrierId, ratio),
        onSuccess: (_, { experimentId, carrierId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: carrierKeys.detail(carrierId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to remove a carrier from an experiment.
 */
export function useRemoveCarrierFromExperiment(): UseMutationResult<
    void,
    Error,
    { experimentId: number; carrierId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, carrierId }) =>
            experimentApi.removeCarrier(experimentId, carrierId),
        onSuccess: (_, { experimentId, carrierId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: carrierKeys.detail(carrierId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to update carrier ratio for an experiment.
 */
export function useUpdateExperimentCarrierRatio(): UseMutationResult<
    void,
    Error,
    { experimentId: number; carrierId: number; ratio: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ experimentId, carrierId, ratio }) =>
            experimentApi.updateCarrierRatio(experimentId, carrierId, ratio),
        onSuccess: (_, { experimentId }) => {
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}
