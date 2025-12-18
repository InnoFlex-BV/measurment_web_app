/**
 * Reactor API service functions.
 *
 * Reactors are the vessels where catalytic reactions and plasma experiments
 * are conducted. Each reactor has specific characteristics that affect
 * experimental results.
 */

import apiClient from './client';
import type {
    Reactor,
    ReactorCreate,
    ReactorUpdate,
    ReactorListParams,
} from './types';

/**
 * Fetch a list of reactors with optional filtering.
 */
export const list = async (params?: ReactorListParams): Promise<Reactor[]> => {
    const response = await apiClient.get('/api/reactors/', { params });
    return response.data;
};

/**
 * Fetch a single reactor by ID.
 */
export const get = async (id: number, include?: string): Promise<Reactor> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/reactors/${id}`, { params });
    return response.data;
};

/**
 * Create a new reactor.
 */
export const create = async (data: ReactorCreate): Promise<Reactor> => {
    const response = await apiClient.post('/api/reactors/', data);
    return response.data;
};

/**
 * Update a reactor.
 */
export const update = async (id: number, data: ReactorUpdate): Promise<Reactor> => {
    const response = await apiClient.patch(`/api/reactors/${id}`, data);
    return response.data;
};

/**
 * Delete a reactor.
 *
 * Fails if reactor is referenced by experiments (RESTRICT).
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/reactors/${id}`, { params });
};

export default {
    list,
    get,
    create,
    update,
    remove,
};