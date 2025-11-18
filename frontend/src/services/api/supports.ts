/**
 * Support API service functions.
 */

import apiClient from './client';
import type { Support, SupportCreate, SupportUpdate, SupportListParams } from './types';

export const list = async (params?: SupportListParams): Promise<Support[]> => {
    const response = await apiClient.get('/api/supports/', { params });
    return response.data;
};

export const get = async (id: number): Promise<Support> => {
    const response = await apiClient.get(`/api/supports/${id}`);
    return response.data;
};

export const create = async (data: SupportCreate): Promise<Support> => {
    const response = await apiClient.post('/api/supports/', data);
    return response.data;
};

export const update = async (id: number, data: SupportUpdate): Promise<Support> => {
    const response = await apiClient.patch(`/api/supports/${id}`, data);
    return response.data;
};

export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/supports/${id}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
};