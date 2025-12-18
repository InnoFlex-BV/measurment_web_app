/**
 * Analyzer API service functions.
 *
 * Analyzers are instruments used to measure experimental outputs.
 * Supports polymorphic handling of FTIR and OES analyzer subtypes.
 *
 * FTIR: Fourier Transform Infrared spectrometer - measures gas composition
 * OES: Optical Emission Spectrometer - measures plasma emissions
 */

import apiClient from './client';
import type {
    Analyzer,
    FTIRAnalyzer,
    OESAnalyzer,
    AnalyzerCreate,
    AnalyzerUpdate,
    AnalyzerListParams,
} from './types';

/**
 * Fetch a list of analyzers with optional filtering.
 * Returns polymorphic results - FTIR and OES with their type-specific fields.
 */
export const list = async (params?: AnalyzerListParams): Promise<Analyzer[]> => {
    const response = await apiClient.get('/api/analyzers/', { params });
    return response.data;
};

/**
 * Fetch FTIR analyzers only.
 */
export const listFTIR = async (params?: Omit<AnalyzerListParams, 'analyzer_type'>): Promise<FTIRAnalyzer[]> => {
    const response = await apiClient.get('/api/analyzers/ftir/', { params });
    return response.data;
};

/**
 * Fetch OES analyzers only.
 */
export const listOES = async (params?: Omit<AnalyzerListParams, 'analyzer_type'>): Promise<OESAnalyzer[]> => {
    const response = await apiClient.get('/api/analyzers/oes/', { params });
    return response.data;
};

/**
 * Fetch a single analyzer by ID.
 * Returns the full polymorphic type with all type-specific fields.
 */
export const get = async (id: number, include?: string): Promise<Analyzer> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/analyzers/${id}`, { params });
    return response.data;
};

/**
 * Create a new analyzer.
 *
 * The analyzer_type field determines which subtype is created:
 * - 'ftir': Creates FTIR analyzer with path_length, resolution, interval, scans
 * - 'oes': Creates OES analyzer with integration_time, scans
 */
export const create = async (data: AnalyzerCreate): Promise<Analyzer> => {
    const response = await apiClient.post('/api/analyzers/', data);
    return response.data;
};

/**
 * Update an analyzer.
 *
 * The analyzer_type cannot be changed after creation.
 */
export const update = async (id: number, data: AnalyzerUpdate): Promise<Analyzer> => {
    const response = await apiClient.patch(`/api/analyzers/${id}`, data);
    return response.data;
};

/**
 * Delete an analyzer.
 *
 * Fails if analyzer is referenced by experiments (RESTRICT).
 */
export const remove = async (id: number, force?: boolean): Promise<void> => {
    const params = force ? { force: true } : undefined;
    await apiClient.delete(`/api/analyzers/${id}`, { params });
};

export default {
    list,
    listFTIR,
    listOES,
    get,
    create,
    update,
    remove,
};