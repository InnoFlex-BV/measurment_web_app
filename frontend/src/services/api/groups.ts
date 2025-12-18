/**
 * Group API service functions.
 *
 * Groups are collections of related experiments for analysis.
 * They help organize experiments by research theme, project, or
 * comparison sets.
 */

import apiClient from './client';
import type {
    Group,
    GroupCreate,
    GroupUpdate,
    GroupListParams,
} from './types';

/**
 * Fetch a list of groups with optional filtering.
 */
export const list = async (params?: GroupListParams): Promise<Group[]> => {
    const response = await apiClient.get('/api/groups/', { params });
    return response.data;
};

/**
 * Fetch a single group by ID.
 */
export const get = async (id: number, include?: string): Promise<Group> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/groups/${id}`, { params });
    return response.data;
};

/**
 * Create a new group.
 */
export const create = async (data: GroupCreate): Promise<Group> => {
    const response = await apiClient.post('/api/groups/', data);
    return response.data;
};

/**
 * Update a group.
 */
export const update = async (id: number, data: GroupUpdate): Promise<Group> => {
    const response = await apiClient.patch(`/api/groups/${id}`, data);
    return response.data;
};

/**
 * Delete a group.
 *
 * Removing a group removes junction table entries but does not delete experiments.
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/groups/${id}`);
};

/**
 * Add an experiment to a group.
 */
export const addExperiment = async (groupId: number, experimentId: number): Promise<void> => {
    await apiClient.post(`/api/groups/${groupId}/experiments/${experimentId}`);
};

/**
 * Remove an experiment from a group.
 */
export const removeExperiment = async (groupId: number, experimentId: number): Promise<void> => {
    await apiClient.delete(`/api/groups/${groupId}/experiments/${experimentId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    addExperiment,
    removeExperiment,
};