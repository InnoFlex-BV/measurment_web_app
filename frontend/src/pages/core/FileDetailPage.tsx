/**
 * FileDetailPage - Detail view for a single file metadata record.
 *
 * Displays comprehensive information about a file including its metadata,
 * upload information, and status. Provides actions for editing, deleting,
 * and restoring soft-deleted files.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFile, useDeleteFile, useRestoreFile, useHardDeleteFile } from '@/hooks/useFiles';
import { Button, Badge } from '@/components/common';
import { format, isValid, parseISO } from 'date-fns';

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
 * Safely format a date string, handling null/undefined and invalid dates.
 * Uses parseISO for proper ISO 8601 date parsing from API responses.
 */
function safeFormatDate(dateString: string | undefined | null, formatString: string = "MMMM d, yyyy 'at' h:mm a"): string {
    if (!dateString) return 'Unknown';

    try {
        // Try parsing as ISO string first (recommended for API dates)
        const date = parseISO(dateString);
        if (isValid(date)) {
            return format(date, formatString);
        }

        // Fallback to Date constructor
        const fallbackDate = new Date(dateString);
        if (isValid(fallbackDate)) {
            return format(fallbackDate, formatString);
        }

        return 'Invalid date';
    } catch {
        return 'Invalid date';
    }
}

export const FileDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const fileId = id ? parseInt(id) : undefined;

    const { data: file, isLoading, error } = useFile(fileId, 'uploader');
    const deleteMutation = useDeleteFile();
    const restoreMutation = useRestoreFile();
    const hardDeleteMutation = useHardDeleteFile();

    const handleSoftDelete = () => {
        if (!file) return;
        if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
            deleteMutation.mutate(file.id, {
                onSuccess: () => navigate('/files'),
            });
        }
    };

    const handleRestore = () => {
        if (!file) return;
        restoreMutation.mutate(file.id);
    };

    const handleHardDelete = () => {
        if (!file) return;
        if (window.confirm(`PERMANENTLY delete "${file.filename}"? This cannot be undone!`)) {
            hardDeleteMutation.mutate(file.id, {
                onSuccess: () => navigate('/files'),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading file...</p>
                </div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>File not found or error loading data.</p>
                    <Link to="/files">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Files
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>{file.filename}</h1>
                        {file.is_deleted ? (
                            <Badge variant="danger">Deleted</Badge>
                        ) : (
                            <Badge variant="success">Active</Badge>
                        )}
                    </div>
                    <p className="page-description">File metadata record #{file.id}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to="/files">
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                    {file.is_deleted ? (
                        <>
                            <Button
                                variant="primary"
                                onClick={handleRestore}
                                disabled={restoreMutation.isPending}
                            >
                                {restoreMutation.isPending ? 'Restoring...' : 'Restore File'}
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleHardDelete}
                                disabled={hardDeleteMutation.isPending}
                            >
                                {hardDeleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to={`/files/${file.id}/edit`}>
                                <Button variant="secondary">Edit</Button>
                            </Link>
                            <Button
                                variant="danger"
                                onClick={handleSoftDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Deleted Warning Banner */}
            {file.is_deleted && (
                <div
                    className="card"
                    style={{
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    <p style={{ margin: 0 }}>
                        <strong>This file has been deleted.</strong> It was deleted on{' '}
                        {safeFormatDate(file.deleted_at)}.
                        You can restore it or permanently delete it using the buttons above.
                    </p>
                </div>
            )}

            {/* File Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {/* Basic Information */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        File Information
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Filename
                            </dt>
                            <dd style={{ margin: 0, fontWeight: 500 }}>{file.filename}</dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                MIME Type
                            </dt>
                            <dd style={{ margin: 0 }}>
                                <Badge variant="info">{file.mime_type}</Badge>
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                File Size
                            </dt>
                            <dd style={{ margin: 0 }}>{formatFileSize(file.file_size)}</dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Storage Path
                            </dt>
                            <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                {file.storage_path}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Upload Information */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Upload Information
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Uploaded By
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {file.uploader ? (
                                    <span>{file.uploader.full_name} ({file.uploader.username})</span>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Unknown</span>
                                )}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Created At
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {safeFormatDate(file.created_at)}
                            </dd>
                        </div>
                        <div>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Last Updated
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {safeFormatDate(file.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Error Display */}
            {(deleteMutation.error || restoreMutation.error || hardDeleteMutation.error) && (
                <div
                    className="card"
                    style={{
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                        marginTop: 'var(--spacing-lg)',
                    }}
                >
                    <p style={{ margin: 0 }}>
                        <strong>Error:</strong>{' '}
                        {deleteMutation.error?.message || restoreMutation.error?.message || hardDeleteMutation.error?.message}
                    </p>
                </div>
            )}
        </div>
    );
};
