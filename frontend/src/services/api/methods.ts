/**
 * Method API service functions.
 */

import apiClient from './client';
import type { Method, MethodCreate, MethodUpdate, MethodListParams } from './types';

export const list = async (params?: MethodListParams): Promise<Method[]> => {
    const response = await apiClient.get('/api/methods/', { params });
    return response.data;
};

export const get = async (id: number, include?: string): Promise<Method> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/methods/${id}`, { params });
    return response.data;
};

export const create = async (data: MethodCreate): Promise<Method> => {
    const response = await apiClient.post('/api/methods/', data);
    return response.data;
};

export const update = async (id: number, data: MethodUpdate): Promise<Method> => {
    const response = await apiClient.patch(`/api/methods/${id}`, data);
    return response.data;
};

export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/methods/${id}`);
};

/**
 * Add a chemical to a method's chemical list.
 * This uses the granular relationship management endpoint.
 */
export const addChemical = async (methodId: number, chemicalId: number): Promise<void> => {
    await apiClient.post(`/api/methods/${methodId}/chemicals/${chemicalId}`);
};

/**
 * Remove a chemical from a method's chemical list.
 */
export const removeChemical = async (methodId: number, chemicalId: number): Promise<void> => {
    await apiClient.delete(`/api/methods/${methodId}/chemicals/${chemicalId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    addChemical,
    removeChemical,
};