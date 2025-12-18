/**
 * Experiment API service functions.
 *
 * Experiments are the core data collection entities, recording conditions
 * and results of catalytic testing. This service supports polymorphic handling
 * of Plasma, Photocatalysis, and Misc experiment subtypes.
 *
 * The experiment_type field determines which subtype is created/returned:
 * - 'plasma': Plasma-catalysis experiments
 * - 'photocatalysis': Light-driven catalytic reactions
 * - 'misc': Miscellaneous experiment types
 */

import apiClient from './client';
import type {
    Experiment,
    PlasmaExperiment,
    PhotocatalysisExperiment,
    MiscExperiment,
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentListParams,
    ExperimentType,
} from './types';

/**
 * Fetch a list of experiments with optional filtering.
 * Returns polymorphic results - Plasma, Photocatalysis, and Misc with their type-specific fields.
 */
export const list = async (params?: ExperimentListParams): Promise<Experiment[]> => {
    const response = await apiClient.get('/api/experiments/', { params });
    return response.data;
};

/**
 * Fetch plasma experiments only.
 */
export const listPlasma = async (params?: Omit<ExperimentListParams, 'experiment_type'>): Promise<PlasmaExperiment[]> => {
    const response = await apiClient.get('/api/experiments/plasma/', { params });
    return response.data;
};

/**
 * Fetch photocatalysis experiments only.
 */
export const listPhotocatalysis = async (params?: Omit<ExperimentListParams, 'experiment_type'>): Promise<PhotocatalysisExperiment[]> => {
    const response = await apiClient.get('/api/experiments/photocatalysis/', { params });
    return response.data;
};

/**
 * Fetch misc experiments only.
 */
export const listMisc = async (params?: Omit<ExperimentListParams, 'experiment_type'>): Promise<MiscExperiment[]> => {
    const response = await apiClient.get('/api/experiments/misc/', { params });
    return response.data;
};

/**
 * Fetch experiments by type.
 */
export const listByType = async (
    experimentType: ExperimentType,
    params?: Omit<ExperimentListParams, 'experiment_type'>
): Promise<Experiment[]> => {
    switch (experimentType) {
        case 'plasma':
            return listPlasma(params);
        case 'photocatalysis':
            return listPhotocatalysis(params);
        case 'misc':
            return listMisc(params);
        default:
            return list({ ...params, experiment_type: experimentType });
    }
};

/**
 * Fetch a single experiment by ID.
 * Returns the full polymorphic type with all type-specific fields.
 */
export const get = async (id: number, include?: string): Promise<Experiment> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/experiments/${id}`, { params });
    return response.data;
};

/**
 * Create a new experiment.
 *
 * The experiment_type field determines which subtype is created:
 * - 'plasma': Creates Plasma experiment with driving_waveform, power, etc.
 * - 'photocatalysis': Creates Photocatalysis experiment with wavelength, power
 * - 'misc': Creates Misc experiment with description
 */
export const create = async (data: ExperimentCreate): Promise<Experiment> => {
    const response = await apiClient.post('/api/experiments/', data);
    return response.data;
};

/**
 * Update an experiment.
 *
 * The experiment_type cannot be changed after creation.
 */
export const update = async (id: number, data: ExperimentUpdate): Promise<Experiment> => {
    const response = await apiClient.patch(`/api/experiments/${id}`, data);
    return response.data;
};

/**
 * Delete an experiment.
 *
 * Also removes all junction table entries (CASCADE).
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${id}`);
};

// ============================================================================
// Relationship Management - Samples
// ============================================================================

/**
 * Add a sample to an experiment.
 */
export const addSample = async (experimentId: number, sampleId: number): Promise<void> => {
    await apiClient.post(`/api/experiments/${experimentId}/samples/${sampleId}`);
};

/**
 * Remove a sample from an experiment.
 */
export const removeSample = async (experimentId: number, sampleId: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${experimentId}/samples/${sampleId}`);
};

// ============================================================================
// Relationship Management - Groups
// ============================================================================

/**
 * Add an experiment to a group.
 */
export const addToGroup = async (experimentId: number, groupId: number): Promise<void> => {
    await apiClient.post(`/api/experiments/${experimentId}/groups/${groupId}`);
};

/**
 * Remove an experiment from a group.
 */
export const removeFromGroup = async (experimentId: number, groupId: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${experimentId}/groups/${groupId}`);
};

// ============================================================================
// Relationship Management - Users
// ============================================================================

/**
 * Add a user to an experiment.
 */
export const addUser = async (experimentId: number, userId: number): Promise<void> => {
    await apiClient.post(`/api/experiments/${experimentId}/users/${userId}`);
};

/**
 * Remove a user from an experiment.
 */
export const removeUser = async (experimentId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${experimentId}/users/${userId}`);
};

// ============================================================================
// Relationship Management - Contaminants (with ppm)
// ============================================================================

/**
 * Add a contaminant to an experiment with optional ppm.
 */
export const addContaminant = async (
    experimentId: number,
    contaminantId: number,
    ppm?: number
): Promise<void> => {
    const params = ppm !== undefined ? { ppm } : undefined;
    await apiClient.post(`/api/experiments/${experimentId}/contaminants/${contaminantId}`, null, { params });
};

/**
 * Remove a contaminant from an experiment.
 */
export const removeContaminant = async (experimentId: number, contaminantId: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${experimentId}/contaminants/${contaminantId}`);
};

/**
 * Update contaminant ppm for an experiment.
 */
export const updateContaminantPpm = async (
    experimentId: number,
    contaminantId: number,
    ppm: number
): Promise<void> => {
    await apiClient.patch(`/api/experiments/${experimentId}/contaminants/${contaminantId}`, { ppm });
};

// ============================================================================
// Relationship Management - Carriers (with ratio)
// ============================================================================

/**
 * Add a carrier to an experiment with optional ratio.
 */
export const addCarrier = async (
    experimentId: number,
    carrierId: number,
    ratio?: number
): Promise<void> => {
    const params = ratio !== undefined ? { ratio } : undefined;
    await apiClient.post(`/api/experiments/${experimentId}/carriers/${carrierId}`, null, { params });
};

/**
 * Remove a carrier from an experiment.
 */
export const removeCarrier = async (experimentId: number, carrierId: number): Promise<void> => {
    await apiClient.delete(`/api/experiments/${experimentId}/carriers/${carrierId}`);
};

/**
 * Update carrier ratio for an experiment.
 */
export const updateCarrierRatio = async (
    experimentId: number,
    carrierId: number,
    ratio: number
): Promise<void> => {
    await apiClient.patch(`/api/experiments/${experimentId}/carriers/${carrierId}`, { ratio });
};

export default {
    // CRUD
    list,
    listPlasma,
    listPhotocatalysis,
    listMisc,
    listByType,
    get,
    create,
    update,
    remove,
    // Sample relationships
    addSample,
    removeSample,
    // Group relationships
    addToGroup,
    removeFromGroup,
    // User relationships
    addUser,
    removeUser,
    // Contaminant relationships
    addContaminant,
    removeContaminant,
    updateContaminantPpm,
    // Carrier relationships
    addCarrier,
    removeCarrier,
    updateCarrierRatio,
};