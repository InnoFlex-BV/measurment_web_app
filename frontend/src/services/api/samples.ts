/**
 * Sample API service functions.
 *
 * Samples represent prepared portions of catalysts for testing. They track
 * inventory similar to catalysts and can link to characterizations, observations,
 * and experiments.
 */

import apiClient from './client';
import type { Sample, SampleCreate, SampleUpdate, SampleListParams } from './types';

/**
 * Fetch a list of samples with optional filtering.
 *
 * Supports comprehensive filtering:
 * - By source catalyst
 * - By support material
 * - By preparation method
 * - By creator user
 * - By depletion status
 */
export const list = async (params?: SampleListParams): Promise<Sample[]> => {
    const response = await apiClient.get('/api/samples/', { params });
    return response.data;
};

/**
 * Fetch a single sample by ID with optional relationship inclusion.
 *
 * Include options: catalyst, support, method, created_by, characterizations, observations
 */
export const get = async (id: number, include?: string): Promise<Sample> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/samples/${id}`, { params });
    return response.data;
};

/**
 * Create a new sample.
 */
export const create = async (data: SampleCreate): Promise<Sample> => {
    const response = await apiClient.post('/api/samples/', data);
    return response.data;
};

/**
 * Update an existing sample.
 */
export const update = async (id: number, data: SampleUpdate): Promise<Sample> => {
    const response = await apiClient.patch(`/api/samples/${id}`, data);
    return response.data;
};

/**
 * Delete a sample.
 *
 * Use force=true to delete even if sample has linked characterizations/experiments.
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/samples/${id}`, { params });
};

/**
 * Consume material from a sample's remaining amount.
 *
 * This is the primary inventory management operation for samples.
 */
export const consume = async (
    id: number,
    amount: number | string,
    notes?: string
): Promise<Sample> => {
    const params = { amount, notes };
    const response = await apiClient.patch(`/api/samples/${id}/consume`, null, { params });
    return response.data;
};

// ============================================================================
// Relationship Management
// ============================================================================

/**
 * Link a characterization to this sample.
 */
export const addCharacterization = async (
    sampleId: number,
    characterizationId: number
): Promise<void> => {
    await apiClient.post(`/api/samples/${sampleId}/characterizations/${characterizationId}`);
};

/**
 * Remove a characterization link from this sample.
 */
export const removeCharacterization = async (
    sampleId: number,
    characterizationId: number
): Promise<void> => {
    await apiClient.delete(`/api/samples/${sampleId}/characterizations/${characterizationId}`);
};

/**
 * Link an observation to this sample.
 */
export const addObservation = async (
    sampleId: number,
    observationId: number
): Promise<void> => {
    await apiClient.post(`/api/samples/${sampleId}/observations/${observationId}`);
};

/**
 * Remove an observation link from this sample.
 */
export const removeObservation = async (
    sampleId: number,
    observationId: number
): Promise<void> => {
    await apiClient.delete(`/api/samples/${sampleId}/observations/${observationId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    consume,
    addCharacterization,
    removeCharacterization,
    addObservation,
    removeObservation,
};
