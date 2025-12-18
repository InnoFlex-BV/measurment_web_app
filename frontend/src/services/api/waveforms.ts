/**
 * Waveform API service functions.
 *
 * Waveforms define electrical signal parameters used in plasma experiments.
 * They capture AC and pulsing characteristics that control plasma discharge.
 */

import apiClient from './client';
import type {
    Waveform,
    WaveformCreate,
    WaveformUpdate,
    WaveformListParams,
} from './types';

/**
 * Fetch a list of waveforms with optional filtering.
 */
export const list = async (params?: WaveformListParams): Promise<Waveform[]> => {
    const response = await apiClient.get('/api/waveforms/', { params });
    return response.data;
};

/**
 * Fetch a single waveform by ID.
 */
export const get = async (id: number, include?: string): Promise<Waveform> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/waveforms/${id}`, { params });
    return response.data;
};

/**
 * Create a new waveform.
 */
export const create = async (data: WaveformCreate): Promise<Waveform> => {
    const response = await apiClient.post('/api/waveforms/', data);
    return response.data;
};

/**
 * Update a waveform.
 */
export const update = async (id: number, data: WaveformUpdate): Promise<Waveform> => {
    const response = await apiClient.patch(`/api/waveforms/${id}`, data);
    return response.data;
};

/**
 * Delete a waveform.
 *
 * Fails if waveform is referenced by experiments (RESTRICT).
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/waveforms/${id}`, { params });
};

export default {
    list,
    get,
    create,
    update,
    remove,
};