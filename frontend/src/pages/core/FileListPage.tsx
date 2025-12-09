/**
 * FileListPage - List view for all file metadata records.
 *
 * This page displays file metadata with filtering capabilities. Files can be
 * filtered by MIME type prefix (e.g., "image/" for images), uploader, and
 * optionally include soft-deleted files.
 *
 * The page follows the standard list pattern with search, filters, loading
 * states, and action buttons for each row.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFiles, useDeleteFile, useRestoreFile } from '@/hooks/useFiles';
import { Button, TextInput, Select, Badge } from '@/components/common';
import type { FileMetadata } from '@/services/api';
import { format } from 'date-fns';

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get badge variant based on MIME type category
 */
function getMimeTypeBadgeVariant(mimeType: string): 'info' | 'success' | 'warning' | 'neutral' {
    if (mimeType.startsWith('image/')) return 'info';
    if (mimeType.startsWith('text/')) return 'success';
    if (mimeType.startsWith('application/pdf')) return 'warning';
    return 'neutral';
}

export const FileListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [mimeTypeFilter, setMimeTypeFilter] = useState('');
    const [includeDeleted, setIncludeDeleted] = useState(false);

    const { data: files, isLoading, error } = useFiles({
        search: search || undefined,
        mime_type: mimeTypeFilter || undefined,
        include_deleted: includeDeleted,
        include: 'uploader',
    });

    const deleteMutation = useDeleteFile();
    const restoreMutation = useRestoreFile();

    const handleDelete = (file: FileMetadata) => {
        if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
            deleteMutation.mutate(file.id);
        }
    };

    const handleRestore = (file: FileMetadata) => {
        restoreMutation.mutate(file.id);
    };

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Files</h1>
                    <p className="page-description">Manage file metadata and attachments</p>
                </div>
                <Link to="/files/new">
                    <Button variant="primary">Add File Record</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by filename..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">File Type</label>
                        <Select
                            value={mimeTypeFilter}
                            onChange={(e) => setMimeTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="image/">Images</option>
                            <option value="text/">Text Files</option>
                            <option value="application/pdf">PDF Documents</option>
                            <option value="application/json">JSON Files</option>
                            <option value="application/vnd">Office Documents</option>
                        </Select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={includeDeleted}
                                onChange={(e) => setIncludeDeleted(e.target.checked)}
                            />
                            Include deleted files
                        </label>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-container">
                    <p>Loading files...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading files. Please try again.</p>
                </div>
            )}

            {/* Files Table */}
            {files && (
                <>
                    {files.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No files found. {search && 'Try adjusting your search.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Filename</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Size</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Uploaded By</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Created</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {files.map((file) => (
                                    <tr
                                        key={file.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            opacity: file.is_deleted ? 0.6 : 1,
                                        }}
                                    >
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                            <Link
                                                to={`/files/${file.id}`}
                                                style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                            >
                                                {file.filename}
                                            </Link>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                            <Badge variant={getMimeTypeBadgeVariant(file.mime_type)} size="sm">
                                                {file.mime_type.split('/')[0]}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                            {formatFileSize(file.file_size)}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                            {file.uploader?.full_name || file.uploader?.username || '—'}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(file.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                            {file.is_deleted ? (
                                                <Badge variant="danger" size="sm">Deleted</Badge>
                                            ) : (
                                                <Badge variant="success" size="sm">Active</Badge>
                                            )}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                <Link to={`/files/${file.id}`}>
                                                    <Button variant="secondary" size="sm">View</Button>
                                                </Link>
                                                {file.is_deleted ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleRestore(file)}
                                                        disabled={restoreMutation.isPending}
                                                    >
                                                        Restore
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Link to={`/files/${file.id}/edit`}>
                                                            <Button variant="secondary" size="sm">Edit</Button>
                                                        </Link>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(file)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {files.length} file{files.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};
