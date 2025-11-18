/**
 * Catalyst API service functions.
 */

import apiClient from './client';
import type { Catalyst, CatalystCreate, CatalystUpdate, CatalystListParams } from './types';

export const list = async (params?: CatalystListParams): Promise<Catalyst[]> => {
    const response = await apiClient.get('/api/catalysts/', { params });
    return response.data;
};

export const get = async (id: number, include?: string): Promise<Catalyst> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/catalysts/${id}`, { params });
    return response.data;
};

export const create = async (data: CatalystCreate): Promise<Catalyst> => {
    const response = await apiClient.post('/api/catalysts/', data);
    return response.data;
};

export const update = async (id: number, data: CatalystUpdate): Promise<Catalyst> => {
    const response = await apiClient.patch(`/api/catalysts/${id}`, data);
    return response.data;
};

export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${id}`);
};

/**
 * Consume material from a catalyst's remaining amount.
 * This uses the specialized inventory management endpoint.
 */
export const consume = async (
    id: number,
    amount: number | string,
    notes?: string
): Promise<Catalyst> => {
    const params = { amount, notes };
    const response = await apiClient.patch(`/api/catalysts/${id}/consume`, null, { params });
    return response.data;
};

export default {
    list,
    get,
    create,
    update,
    remove,
    consume,
};