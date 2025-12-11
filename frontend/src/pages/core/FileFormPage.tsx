/**
 * FileFormPage - Form for creating and editing file metadata records.
 *
 * This form handles file metadata management. In a production system, actual
 * file upload would typically be handled separately (e.g., direct to S3),
 * with this form capturing the resulting metadata.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useFile, useCreateFile, useUpdateFile } from '@/hooks/useFiles';
import { useUsers } from '@/hooks/useUsers';
import { FormField, TextInput, Select, Button } from '@/components/common';
import type { FileCreate, FileUpdate } from '@/services/api';

export const FileFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    // Fetch existing file if editing
    const { data: file, isLoading: isLoadingFile } = useFile(
        id ? parseInt(id) : undefined
    );

    // Fetch users for uploader dropdown
    const { data: users } = useUsers({ is_active: true });

    // Mutations
    const createMutation = useCreateFile();
    const updateMutation = useUpdateFile();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FileCreate>({
        defaultValues: {
            filename: '',
            storage_path: '',
            file_size: 0,
            mime_type: '',
            uploaded_by_id: undefined,
        },
    });

    // Pre-populate form when editing
    useEffect(() => {
        if (file) {
            reset({
                filename: file.filename,
                storage_path: file.storage_path,
                file_size: file.file_size,
                mime_type: file.mime_type,
                uploaded_by_id: file.uploaded_by_id,
            });
        }
    }, [file, reset]);

    const onSubmit = (data: FileCreate) => {
        if (isEditing && file) {
            // Only filename and storage_path can be updated
            const updateData: FileUpdate = {
                filename: data.filename,
                storage_path: data.storage_path,
            };
            updateMutation.mutate(
                { id: file.id, data: updateData },
                { onSuccess: () => navigate(`/files/${file.id}`) }
            );
        } else {
            createMutation.mutate(data, {
                onSuccess: (newFile) => navigate(`/files/${newFile.id}`),
            });
        }
    };

    if (isEditing && isLoadingFile) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading file...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isEditing ? 'Edit File Metadata' : 'Add File Record'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update filename or storage path'
                        : 'Create a new file metadata record'}
                </p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Filename */}
                    <FormField
                        label="Filename"
                        error={errors.filename?.message}
                        required
                    >
                        <TextInput
                            {...register('filename', {
                                required: 'Filename is required',
                                minLength: { value: 1, message: 'Filename cannot be empty' },
                            })}
                            placeholder="example.pdf"
                            hasError={!!errors.filename}
                        />
                    </FormField>

                    {/* File Path */}
                    <FormField
                        label="Storage Path"
                        error={errors.storage_path?.message}
                        required
                    >
                        <TextInput
                            {...register('storage_path', {
                                required: 'Storage path is required',
                            })}
                            placeholder="/storage/uploads/2024/01/example.pdf"
                            hasError={!!errors.storage_path}
                        />
                    </FormField>

                    {/* Fields only shown when creating */}
                    {!isEditing && (
                        <>
                            {/* MIME Type */}
                            <FormField
                                label="MIME Type"
                                error={errors.mime_type?.message}
                                required
                            >
                                <Select
                                    {...register('mime_type', {
                                        required: 'MIME type is required',
                                    })}
                                    hasError={!!errors.mime_type}
                                >
                                    <option value="">Select MIME type...</option>
                                    <optgroup label="Documents">
                                        <option value="application/pdf">PDF (application/pdf)</option>
                                        <option value="text/plain">Plain Text (text/plain)</option>
                                        <option value="text/csv">CSV (text/csv)</option>
                                        <option value="application/json">JSON (application/json)</option>
                                        <option value="application/xml">XML (application/xml)</option>
                                    </optgroup>
                                    <optgroup label="Images">
                                        <option value="image/jpeg">JPEG (image/jpeg)</option>
                                        <option value="image/png">PNG (image/png)</option>
                                        <option value="image/gif">GIF (image/gif)</option>
                                        <option value="image/tiff">TIFF (image/tiff)</option>
                                    </optgroup>
                                    <optgroup label="Data Files">
                                        <option value="application/octet-stream">Binary Data</option>
                                        <option value="application/x-hdf5">HDF5 Data</option>
                                    </optgroup>
                                </Select>
                            </FormField>

                            {/* File Size */}
                            <FormField
                                label="File Size (bytes)"
                                error={errors.file_size?.message}
                                required
                            >
                                <TextInput
                                    type="number"
                                    {...register('file_size', {
                                        required: 'File size is required',
                                        valueAsNumber: true,
                                        min: { value: 0, message: 'File size must be positive' },
                                    })}
                                    placeholder="1048576"
                                    hasError={!!errors.file_size}
                                />
                            </FormField>

                            {/* Uploader */}
                            <FormField
                                label="Uploaded By"
                                error={errors.uploaded_by_id?.message}
                            >
                                <Select
                                    {...register('uploaded_by_id', {
                                        setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                    })}
                                >
                                    <option value="">Select user (optional)...</option>
                                    {users?.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || user.username}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        </>
                    )}

                    {/* Read-only fields when editing */}
                    {isEditing && file && (
                        <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                <strong>MIME Type:</strong> {file.mime_type}<br />
                                <strong>File Size:</strong> {file.file_size.toLocaleString()} bytes<br />
                                <strong>Uploaded By:</strong> {file.uploader?.full_name || 'Unknown'}
                            </p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                These fields cannot be changed after creation.
                            </p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(isEditing ? `/files/${id}` : '/files')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Save Changes'
                                    : 'Create File Record'}
                        </Button>
                    </div>

                    {/* Error Display */}
                    {(createMutation.error || updateMutation.error) && (
                        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-danger)', color: 'white', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ margin: 0 }}>
                                {createMutation.error?.message || updateMutation.error?.message || 'An error occurred'}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};