/**
 * Custom hooks for user data operations.
 *
 * These hooks encapsulate React Query operations for users, providing a clean
 * interface for components to fetch, create, update, and delete users. The hooks
 * handle all the complexity of caching, loading states, error handling, and
 * cache invalidation, so components can focus on rendering UI.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { userApi, type User, type UserCreate, type UserUpdate, type UserListParams } from '@/services/api';

/**
 * Hook to fetch a list of users with optional filtering.
 *
 * Returns a React Query result object with data, loading state, and error state.
 */
export function useUsers(params?: UserListParams): UseQueryResult<User[], Error> {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => userApi.list(params),
    });
}

/**
 * Hook to fetch a single user by ID.
 *
 * The enabled option controls whether the query runs.
 */
export function useUser(id?: number): UseQueryResult<User, Error> {
    return useQuery({
        queryKey: ['users', id],
        queryFn: () => userApi.get(id!),
        enabled: !!id,
    });
}

/**
 * Hook to create a new user.
 *
 * Returns a mutation object with explicit typing for the input and output.
 */
export function useCreateUser(): UseMutationResult<User, Error, UserCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UserCreate) => userApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Hook to update an existing user.
 *
 * The mutation accepts an object with id and data properties.
 */
export function useUpdateUser(): UseMutationResult<User, Error, { id: number; data: UserUpdate }> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
            userApi.update(id, data),
        onSuccess: (updatedUser: User) => {
            // Now TypeScript knows updatedUser is of type User
            queryClient.setQueryData(['users', updatedUser.id], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Hook to delete a user.
 *
 * The mutation accepts a user ID and returns void on success.
 */
export function useDeleteUser(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userApi.remove(id),
        onSuccess: (_, deletedId: number) => {
            queryClient.removeQueries({ queryKey: ['users', deletedId] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
