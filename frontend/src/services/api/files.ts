/**
 * File metadata API service functions.
 *
 * This module handles file metadata management. Note that actual file upload/download
 * would typically be handled separately (e.g., direct to S3), while this API
 * manages the metadata records that track those files.
 */

import apiClient from './client';
import type { FileMetadata, FileCreate, FileUpdate, FileListParams } from './types';

/**
 * Fetch a list of files with optional filtering.
 *
 * By default, soft-deleted files are excluded. Use include_deleted=true
 * to include them in results.
 */
export const list = async (params?: FileListParams): Promise<FileMetadata[]> => {
    const response = await apiClient.get('/api/files/', { params });
    return response.data;
};

/**
 * Fetch a single file by ID.
 */
export const get = async (id: number, include?: string): Promise<FileMetadata> => {
    const params = include ? { include } : undefined;
    const response = await apiClient.get(`/api/files/${id}`, { params });
    return response.data;
};

/**
 * Create a new file metadata record.
 *
 * This creates the metadata entry - actual file upload would typically
 * happen separately to a storage service.
 */
export const create = async (data: FileCreate): Promise<FileMetadata> => {
    const response = await apiClient.post('/api/files/', data);
    return response.data;
};

/**
 * Update file metadata.
 *
 * Only filename and file_path can be updated after creation.
 */
export const update = async (id: number, data: FileUpdate): Promise<FileMetadata> => {
    const response = await apiClient.patch(`/api/files/${id}`, data);
    return response.data;
};

/**
 * Soft delete a file.
 *
 * This marks the file as deleted but doesn't remove the record.
 * The actual file in storage may need separate cleanup.
 */
export const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/files/${id}`);
};

/**
 * Restore a soft-deleted file.
 */
export const restore = async (id: number): Promise<FileMetadata> => {
    const response = await apiClient.post(`/api/files/${id}/restore`);
    return response.data;
};

/**
 * Permanently delete a file (hard delete).
 *
 * Use with caution - this cannot be undone.
 */
export const hardDelete = async (id: number): Promise<void> => {
    await apiClient.delete(`/api/files/${id}`, { params: { permanent: true } });
};

export default {
    list,
    get,
    create,
    update,
    remove,
    restore,
    hardDelete,
};
