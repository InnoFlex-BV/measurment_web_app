/**
 * Characterization API service functions.
 *
 * Characterizations are analytical measurements performed on catalysts or samples.
 * They support multiple types (XRD, BET, TEM, etc.) and can link to file metadata
 * for raw and processed data storage.
 */

import apiClient from './client';
import type {
    Characterization,
    CharacterizationCreate,
    CharacterizationUpdate,
    CharacterizationListParams,
} from './types';

/**
 * Fetch a list of characterizations with optional filtering.
 *
 * Supports filtering by:
 * - Search term (name, equipment)
 * - Characterization type (XRD, BET, TEM, etc.)
 * - Performed by (user ID)
 */
export const list = async (params?: CharacterizationListParams): Promise<Characterization[]> => {
    const response = await apiClient.get('/api/characterizations/', { params });
    return response.data;
};

/**
 * Fetch a single characterization by ID with optional relationship inclusion.
 *
 * Include options: performed_by, raw_data_file, processed_data_file, catalysts, samples
 */
export const get = async (id: number, include?: string): Promise<Characterization> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/characterizations/${id}`, { params });
    return response.data;
};

/**
 * Create a new characterization record.
 */
export const create = async (data: CharacterizationCreate): Promise<Characterization> => {
    const response = await apiClient.post('/api/characterizations/', data);
    return response.data;
};

/**
 * Update an existing characterization.
 */
export const update = async (
    id: number,
    data: CharacterizationUpdate
): Promise<Characterization> => {
    const response = await apiClient.patch(`/api/characterizations/${id}`, data);
    return response.data;
};

/**
 * Delete a characterization.
 *
 * This removes the characterization record and its links to catalysts/samples.
 * File metadata records are preserved (files may still exist in storage).
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/characterizations/${id}`);
};

// ============================================================================
// Relationship Management
// ============================================================================

/**
 * Link this characterization to a catalyst.
 */
export const addToCatalyst = async (
    characterizationId: number,
    catalystId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/characterizations/${characterizationId}`);
};

/**
 * Remove this characterization's link to a catalyst.
 */
export const removeFromCatalyst = async (
    characterizationId: number,
    catalystId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/characterizations/${characterizationId}`);
};

/**
 * Link this characterization to a sample.
 */
export const addToSample = async (
    characterizationId: number,
    sampleId: number
): Promise<void> => {
    await apiClient.post(`/api/samples/${sampleId}/characterizations/${characterizationId}`);
};

/**
 * Remove this characterization's link to a sample.
 */
export const removeFromSample = async (
    characterizationId: number,
    sampleId: number
): Promise<void> => {
    await apiClient.delete(`/api/samples/${sampleId}/characterizations/${characterizationId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    addToCatalyst,
    removeFromCatalyst,
    addToSample,
    removeFromSample,
};
