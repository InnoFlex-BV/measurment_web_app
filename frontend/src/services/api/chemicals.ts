/**
 * Chemical API service functions.
 */

import apiClient from './client';
import type { Chemical, ChemicalCreate, ChemicalUpdate, ChemicalListParams } from './types';

export const list = async (params?: ChemicalListParams): Promise<Chemical[]> => {
    const response = await apiClient.get('/api/chemicals/', { params });
    return response.data;
};

export const get = async (id: number): Promise<Chemical> => {
    const response = await apiClient.get(`/api/chemicals/${id}`);
    return response.data;
};

export const create = async (data: ChemicalCreate): Promise<Chemical> => {
    const response = await apiClient.post('/api/chemicals/', data);
    return response.data;
};

export const update = async (id: number, data: ChemicalUpdate): Promise<Chemical> => {
    const response = await apiClient.patch(`/api/chemicals/${id}`, data);
    return response.data;
};

export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/chemicals/${id}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
};