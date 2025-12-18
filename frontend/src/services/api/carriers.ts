/**
 * Carrier API service functions.
 *
 * Carriers are the gases used as the main flow in experiments, carrying
 * the contaminants through the reactor. They're linked to experiments
 * through a junction table that also stores the ratio.
 */

import apiClient from './client';
import type {
    Carrier,
    CarrierCreate,
    CarrierUpdate,
    CarrierListParams,
} from './types';

/**
 * Fetch a list of carriers with optional filtering.
 */
export const list = async (params?: CarrierListParams): Promise<Carrier[]> => {
    const response = await apiClient.get('/api/carriers/', { params });
    return response.data;
};

/**
 * Fetch a single carrier by ID.
 */
export const get = async (id: number, include?: string): Promise<Carrier> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/carriers/${id}`, { params });
    return response.data;
};

/**
 * Create a new carrier.
 */
export const create = async (data: CarrierCreate): Promise<Carrier> => {
    const response = await apiClient.post('/api/carriers/', data);
    return response.data;
};

/**
 * Update a carrier.
 */
export const update = async (id: number, data: CarrierUpdate): Promise<Carrier> => {
    const response = await apiClient.patch(`/api/carriers/${id}`, data);
    return response.data;
};

/**
 * Delete a carrier.
 *
 * By default, fails if carrier is referenced by experiments.
 * Use force=true to delete anyway (CASCADE will remove junction entries).
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/carriers/${id}`, { params });
};

export default {
    list,
    get,
    create,
    update,
    remove,
};