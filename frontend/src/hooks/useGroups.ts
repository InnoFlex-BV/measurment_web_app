/**
 * Custom hooks for group operations.
 *
 * Groups are collections of related experiments for analysis.
 * They help organize experiments by research theme, project, or
 * comparison sets.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    groupApi,
    type Group,
    type GroupCreate,
    type GroupUpdate,
    type GroupListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const groupKeys = {
    all: ['groups'] as const,
    lists: () => [...groupKeys.all, 'list'] as const,
    list: (params?: GroupListParams) => [...groupKeys.lists(), params] as const,
    details: () => [...groupKeys.all, 'detail'] as const,
    detail: (id: number) => [...groupKeys.details(), id] as const,
};

// Also define experiment keys for cross-invalidation
const experimentKeys = {
    all: ['experiments'] as const,
    lists: () => [...experimentKeys.all, 'list'] as const,
    details: () => [...experimentKeys.all, 'detail'] as const,
    detail: (id: number) => [...experimentKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of groups with optional filtering.
 */
export function useGroups(params?: GroupListParams): UseQueryResult<Group[], Error> {
    return useQuery({
        queryKey: groupKeys.list(params),
        queryFn: () => groupApi.list(params),
    });
}

/**
 * Hook to fetch a single group by ID.
 */
export function useGroup(
    id?: number,
    include?: string
): UseQueryResult<Group, Error> {
    return useQuery({
        queryKey: [...groupKeys.detail(id!), include],
        queryFn: () => groupApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new group.
 */
export function useCreateGroup(): UseMutationResult<Group, Error, GroupCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: GroupCreate) => groupApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        },
    });
}

/**
 * Hook to update a group.
 */
export function useUpdateGroup(): UseMutationResult<
    Group,
    Error,
    { id: number; data: GroupUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => groupApi.update(id, data),
        onSuccess: (updatedGroup) => {
            queryClient.setQueryData(groupKeys.detail(updatedGroup.id), updatedGroup);
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        },
    });
}

/**
 * Hook to delete a group.
 */
export function useDeleteGroup(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => groupApi.remove(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
            // Also invalidate experiments as their group relationships changed
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to add an experiment to a group.
 */
export function useAddExperimentToGroup(): UseMutationResult<
    void,
    Error,
    { groupId: number; experimentId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, experimentId }) =>
            groupApi.addExperiment(groupId, experimentId),
        onSuccess: (_, { groupId, experimentId }) => {
            // Invalidate both sides of the relationship
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}

/**
 * Hook to remove an experiment from a group.
 */
export function useRemoveExperimentFromGroup(): UseMutationResult<
    void,
    Error,
    { groupId: number; experimentId: number }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, experimentId }) =>
            groupApi.removeExperiment(groupId, experimentId),
        onSuccess: (_, { groupId, experimentId }) => {
            // Invalidate both sides of the relationship
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
            queryClient.invalidateQueries({ queryKey: experimentKeys.detail(experimentId) });
            queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
        },
    });
}