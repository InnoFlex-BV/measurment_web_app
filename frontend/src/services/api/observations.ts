/**
 * Observation API service functions.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. They capture narrative information that doesn't fit into
 * structured characterization data.
 */

import apiClient from './client';
import type {
    Observation,
    ObservationCreate,
    ObservationUpdate,
    ObservationListParams,
} from './types';

/**
 * Fetch a list of observations with optional filtering.
 *
 * Supports filtering by:
 * - Search term (title, content)
 * - Observation type
 * - Observed by (user ID)
 */
export const list = async (params?: ObservationListParams): Promise<Observation[]> => {
    const response = await apiClient.get('/api/observations/', { params });
    return response.data;
};

/**
 * Fetch a single observation by ID with optional relationship inclusion.
 *
 * Include options: observed_by, files, catalysts, samples
 */
export const get = async (id: number, include?: string): Promise<Observation> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/observations/${id}`, { params });
    return response.data;
};

/**
 * Create a new observation.
 */
export const create = async (data: ObservationCreate): Promise<Observation> => {
    const response = await apiClient.post('/api/observations/', data);
    return response.data;
};

/**
 * Update an existing observation.
 */
export const update = async (id: number, data: ObservationUpdate): Promise<Observation> => {
    const response = await apiClient.patch(`/api/observations/${id}`, data);
    return response.data;
};

/**
 * Delete an observation.
 *
 * This removes the observation and its links to catalysts/samples.
 * Linked files are preserved (they may be referenced elsewhere).
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/observations/${id}`);
};

// ============================================================================
// File Attachment Management
// ============================================================================

/**
 * Attach a file to this observation.
 */
export const addFile = async (observationId: number, fileId: number): Promise<void> => {
    await apiClient.post(`/api/observations/${observationId}/files/${fileId}`);
};

/**
 * Remove a file attachment from this observation.
 */
export const removeFile = async (observationId: number, fileId: number): Promise<void> => {
    await apiClient.delete(`/api/observations/${observationId}/files/${fileId}`);
};

// ============================================================================
// Relationship Management
// ============================================================================

/**
 * Link this observation to a catalyst.
 */
export const addToCatalyst = async (
    observationId: number,
    catalystId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/observations/${observationId}`);
};

/**
 * Remove this observation's link to a catalyst.
 */
export const removeFromCatalyst = async (
    observationId: number,
    catalystId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/observations/${observationId}`);
};

/**
 * Link this observation to a sample.
 */
export const addToSample = async (
    observationId: number,
    sampleId: number
): Promise<void> => {
    await apiClient.post(`/api/samples/${sampleId}/observations/${observationId}`);
};

/**
 * Remove this observation's link to a sample.
 */
export const removeFromSample = async (
    observationId: number,
    sampleId: number
): Promise<void> => {
    await apiClient.delete(`/api/samples/${sampleId}/observations/${observationId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    addFile,
    removeFile,
    addToCatalyst,
    removeFromCatalyst,
    addToSample,
    removeFromSample,
};
