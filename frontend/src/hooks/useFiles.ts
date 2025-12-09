/**
 * Custom hooks for file metadata operations.
 *
 * These hooks encapsulate React Query operations for file metadata, providing
 * a clean interface for components to fetch, create, update, and delete file
 * records. Note that actual file upload/download may require separate handling.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query';
import {
    fileApi,
    type FileMetadata,
    type FileCreate,
    type FileUpdate,
    type FileListParams,
} from '@/services/api';

/**
 * Query key factory for consistent cache key management.
 */
const fileKeys = {
    all: ['files'] as const,
    lists: () => [...fileKeys.all, 'list'] as const,
    list: (params?: FileListParams) => [...fileKeys.lists(), params] as const,
    details: () => [...fileKeys.all, 'detail'] as const,
    detail: (id: number) => [...fileKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of files with optional filtering.
 */
export function useFiles(params?: FileListParams): UseQueryResult<FileMetadata[], Error> {
    return useQuery({
        queryKey: fileKeys.list(params),
        queryFn: () => fileApi.list(params),
    });
}

/**
 * Hook to fetch a single file by ID.
 */
export function useFile(
    id?: number,
    include?: string
): UseQueryResult<FileMetadata, Error> {
    return useQuery({
        queryKey: [...fileKeys.detail(id!), include],
        queryFn: () => fileApi.get(id!, include),
        enabled: !!id,
    });
}

/**
 * Hook to create a new file metadata record.
 */
export function useCreateFile(): UseMutationResult<FileMetadata, Error, FileCreate> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FileCreate) => fileApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
        },
    });
}

/**
 * Hook to update file metadata.
 */
export function useUpdateFile(): UseMutationResult<
    FileMetadata,
    Error,
    { id: number; data: FileUpdate }
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => fileApi.update(id, data),
        onSuccess: (updatedFile) => {
            queryClient.setQueryData(fileKeys.detail(updatedFile.id), updatedFile);
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
        },
    });
}

/**
 * Hook to soft delete a file.
 */
export function useDeleteFile(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => fileApi.remove(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: fileKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
        },
    });
}

/**
 * Hook to restore a soft-deleted file.
 */
export function useRestoreFile(): UseMutationResult<FileMetadata, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => fileApi.restore(id),
        onSuccess: (restoredFile) => {
            queryClient.setQueryData(fileKeys.detail(restoredFile.id), restoredFile);
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
        },
    });
}

/**
 * Hook to permanently delete a file.
 */
export function useHardDeleteFile(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => fileApi.hardDelete(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: fileKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
        },
    });
}