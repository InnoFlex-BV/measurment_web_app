/**
 * Catalyst API service functions.
 *
 * Catalysts are the core research artifacts. This service provides CRUD operations,
 * inventory management (consume), and relationship management for linking to
 * characterizations, observations, and users.
 */

import apiClient from './client';
import type { Catalyst, CatalystCreate, CatalystUpdate, CatalystListParams } from './types';

/**
 * Fetch a list of catalysts with optional filtering.
 */
export const list = async (params?: CatalystListParams): Promise<Catalyst[]> => {
    const response = await apiClient.get('/api/catalysts/', { params });
    return response.data;
};

/**
 * Fetch a single catalyst by ID with optional relationship inclusion.
 *
 * Include options: method, input_catalysts, output_catalysts, samples,
 *                  characterizations, observations, users
 */
export const get = async (id: number, include?: string): Promise<Catalyst> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/catalysts/${id}`, { params });
    return response.data;
};

/**
 * Create a new catalyst.
 */
export const create = async (data: CatalystCreate): Promise<Catalyst> => {
    const response = await apiClient.post('/api/catalysts/', data);
    return response.data;
};

/**
 * Update a catalyst.
 */
export const update = async (id: number, data: CatalystUpdate): Promise<Catalyst> => {
    const response = await apiClient.patch(`/api/catalysts/${id}`, data);
    return response.data;
};

/**
 * Delete a catalyst.
 */
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

// ============================================================================
// Relationship Management - Characterizations
// ============================================================================

/**
 * Link a characterization to this catalyst.
 */
export const addCharacterization = async (
    catalystId: number,
    characterizationId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/characterizations/${characterizationId}`);
};

/**
 * Remove a characterization link from this catalyst.
 */
export const removeCharacterization = async (
    catalystId: number,
    characterizationId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/characterizations/${characterizationId}`);
};

// ============================================================================
// Relationship Management - Observations
// ============================================================================

/**
 * Link an observation to this catalyst.
 */
export const addObservation = async (
    catalystId: number,
    observationId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/observations/${observationId}`);
};

/**
 * Remove an observation link from this catalyst.
 */
export const removeObservation = async (
    catalystId: number,
    observationId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/observations/${observationId}`);
};

// ============================================================================
// Relationship Management - Users
// ============================================================================

/**
 * Add a user to this catalyst (record that they worked on it).
 */
export const addUser = async (
    catalystId: number,
    userId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/users/${userId}`);
};

/**
 * Remove a user from this catalyst.
 */
export const removeUser = async (
    catalystId: number,
    userId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/users/${userId}`);
};

// ============================================================================
// Relationship Management - Input Catalysts
// ============================================================================

/**
 * Add an input catalyst (this catalyst was derived from another).
 */
export const addInputCatalyst = async (
    catalystId: number,
    inputCatalystId: number
): Promise<void> => {
    await apiClient.post(`/api/catalysts/${catalystId}/input-catalysts/${inputCatalystId}`);
};

/**
 * Remove an input catalyst link.
 */
export const removeInputCatalyst = async (
    catalystId: number,
    inputCatalystId: number
): Promise<void> => {
    await apiClient.delete(`/api/catalysts/${catalystId}/input-catalysts/${inputCatalystId}`);
};

export default {
    list,
    get,
    create,
    update,
    remove,
    consume,
    // Characterization relationships
    addCharacterization,
    removeCharacterization,
    // Observation relationships
    addObservation,
    removeObservation,
    // User relationships
    addUser,
    removeUser,
    // Input catalyst relationships
    addInputCatalyst,
    removeInputCatalyst,
};
