/**
 * Processed Results API Service
 *
 * Handles CRUD operations for processed/calculated experiment results.
 * Processed results store key performance metrics like DRE (Decomposition/Removal
 * Efficiency) and EY (Energy Yield) that are calculated from raw experiment data.
 *
 * @module services/api/processed
 */

import apiClient from './client';
import type {
    Processed,
    ProcessedCreate,
    ProcessedUpdate,
    ProcessedListParams,
} from './types';

/**
 * Processed Results API methods.
 */
const processedApi = {
    /**
     * List processed results with optional filtering.
     *
     * @param params - Query parameters for filtering
     * @returns Array of processed results
     *
     * @example
     * // Get all complete results
     * const results = await processedApi.list({ complete_only: true });
     *
     * @example
     * // Get results with DRE > 80%
     * const highEfficiency = await processedApi.list({ min_dre: 80 });
     */
    async list(params?: ProcessedListParams): Promise<Processed[]> {
        const response = await apiClient.get<Processed[]>('/api/processed/', { params });
        return response.data;
    },

    /**
     * Get a single processed result by ID.
     *
     * @param id - Processed result ID
     * @param include - Comma-separated relationships to include (e.g., "experiments")
     * @returns The processed result
     *
     * @example
     * const result = await processedApi.get(1, 'experiments');
     */
    async get(id: number, include?: string): Promise<Processed> {
        const response = await apiClient.get<Processed>(`/api/processed/${id}`, {
            params: include ? { include } : undefined,
        });
        return response.data;
    },

    /**
     * Create a new processed result.
     *
     * @param data - Processed result data
     * @returns The created processed result
     *
     * @example
     * const newResult = await processedApi.create({
     *     dre: 85.5,
     *     ey: 12.3,
     * });
     */
    async create(data: ProcessedCreate): Promise<Processed> {
        const response = await apiClient.post<Processed>('/api/processed/', data);
        return response.data;
    },

    /**
     * Update an existing processed result.
     *
     * @param id - Processed result ID
     * @param data - Fields to update
     * @returns The updated processed result
     *
     * @example
     * const updated = await processedApi.update(1, { dre: 90.0 });
     */
    async update(id: number, data: ProcessedUpdate): Promise<Processed> {
        const response = await apiClient.patch<Processed>(`/api/processed/${id}`, data);
        return response.data;
    },

    /**
     * Delete a processed result.
     *
     * @param id - Processed result ID
     *
     * @example
     * await processedApi.delete(1);
     */
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/api/processed/${id}`);
    },
};

export default processedApi;
