/**
 * Contaminant API service functions.
 *
 * Contaminants are the target compounds that experiments aim to remove
 * or decompose. They're linked to experiments through a junction table
 * that also stores the concentration (ppm).
 */

import apiClient from './client';
import type {
    Contaminant,
    ContaminantCreate,
    ContaminantUpdate,
    ContaminantListParams,
} from './types';

/**
 * Fetch a list of contaminants with optional filtering.
 */
export const list = async (params?: ContaminantListParams): Promise<Contaminant[]> => {
    const response = await apiClient.get('/api/contaminants/', { params });
    return response.data;
};

/**
 * Fetch a single contaminant by ID.
 */
export const get = async (id: number, include?: string): Promise<Contaminant> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/contaminants/${id}`, { params });
    return response.data;
};

/**
 * Create a new contaminant.
 */
export const create = async (data: ContaminantCreate): Promise<Contaminant> => {
    const response = await apiClient.post('/api/contaminants/', data);
    return response.data;
};

/**
 * Update a contaminant.
 */
export const update = async (id: number, data: ContaminantUpdate): Promise<Contaminant> => {
    const response = await apiClient.patch(`/api/contaminants/${id}`, data);
    return response.data;
};

/**
 * Delete a contaminant.
 *
 * By default, fails if contaminant is referenced by experiments.
 * Use force=true to delete anyway (CASCADE will remove junction entries).
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/contaminants/${id}`, { params });
};

export default {
    list,
    get,
    create,
    update,
    remove,
};