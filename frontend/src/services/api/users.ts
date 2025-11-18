/**
 * User API service functions.
 *
 * This module provides typed functions for all user-related API operations.
 * Each function encapsulates the HTTP request details, error handling, and
 * response parsing, providing a clean interface for React components.
 *
 * These functions are designed to work seamlessly with React Query, which
 * handles caching, refetching, and state management automatically.
 */

import apiClient from './client';
import type { User, UserCreate, UserUpdate, UserListParams } from './types';

/**
 * Fetch a list of users with optional filtering.
 *
 * This function demonstrates the pattern for list endpoints that all other
 * entity services will follow. The params object contains optional query
 * parameters that get serialized into the URL query string.
 *
 * Example usage with React Query:
 * const { data: users } = useQuery({
 *   queryKey: ['users', { search: 'john' }],
 *   queryFn: () => userApi.list({ search: 'john' })
 * });
 */
export const list = async (params?: UserListParams): Promise<User[]> => {
    const response = await apiClient.get('/api/users/', { params });
    return response.data;
};

/**
 * Fetch a single user by ID.
 *
 * Example usage:
 * const { data: user } = useQuery({
 *   queryKey: ['users', id],
 *   queryFn: () => userApi.get(id)
 * });
 */
export const get = async (id: number): Promise<User> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
};

/**
 * Create a new user.
 *
 * Example usage with React Query mutation:
 * const mutation = useMutation({
 *   mutationFn: userApi.create,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ['users'] });
 *   }
 * });
 */
export const create = async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post('/api/users/', data);
    return response.data;
};

/**
 * Update an existing user.
 *
 * Example usage:
 * const mutation = useMutation({
 *   mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
 *     userApi.update(id, data),
 *   onSuccess: (data) => {
 *     queryClient.setQueryData(['users', data.id], data);
 *   }
 * });
 */
export const update = async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.patch(`/api/users/${id}`, data);
    return response.data;
};

/**
 * Delete a user.
 *
 * Example usage:
 * const mutation = useMutation({
 *   mutationFn: userApi.remove,
 *   onSuccess: (_, id) => {
 *     queryClient.removeQueries({ queryKey: ['users', id] });
 *     queryClient.invalidateQueries({ queryKey: ['users'] });
 *   }
 * });
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
};

// Export as a namespace for cleaner imports
export default {
    list,
    get,
    create,
    update,
    remove,
};