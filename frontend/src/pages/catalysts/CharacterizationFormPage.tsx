/**
 * CharacterizationFormPage - Form for creating and editing characterizations.
 *
 * Handles the type_name field and optional relationships
 * to files, performers, and linked materials.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    useCharacterization,
    useCreateCharacterization,
    useUpdateCharacterization,
} from '@/hooks/useCharacterizations';
import { useUsers } from '@/hooks/useUsers';
import { useFiles } from '@/hooks/useFiles';
import { FormField, TextArea, Select, Button } from '@/components/common';
import {
    type CharacterizationCreate,
    type CharacterizationUpdate,
    type CharacterizationType,
    CHARACTERIZATION_TYPE_LABELS,
} from '@/services/api';

/**
 * All available characterization types
 */
const CHARACTERIZATION_TYPES: CharacterizationType[] = [
    'XRD', 'BET', 'TEM', 'SEM', 'FTIR', 'XPS', 'TPR', 'TGA',
    'UV_VIS', 'RAMAN', 'ICP_OES', 'CHNS', 'NMR', 'GC', 'HPLC', 'MS', 'OTHER',
];

export const CharacterizationFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id;

    // Pre-fill from URL params (when creating from sample/catalyst detail)
    const prefilledSampleId = searchParams.get('sample_id');
    const prefilledCatalystId = searchParams.get('catalyst_id');

    // Fetch existing characterization if editing
    const { data: char, isLoading: isLoadingChar } = useCharacterization(
        id ? parseInt(id) : undefined,
        'users,raw_data_file,processed_data_file'
    );

    // Fetch dropdown data
    const { data: users } = useUsers({ is_active: true });
    const { data: files } = useFiles({ include_deleted: false });

    // Mutations
    const createMutation = useCreateCharacterization();
    const updateMutation = useUpdateCharacterization();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = useForm<CharacterizationCreate>({
        defaultValues: {
            type_name: 'XRD',
            description: '',
            raw_data_id: undefined,
            processed_data_id: undefined,
            catalyst_ids: prefilledCatalystId ? [parseInt(prefilledCatalystId)] : undefined,
            sample_ids: prefilledSampleId ? [parseInt(prefilledSampleId)] : undefined,
            user_ids: [],
        },
    });

    // Watch the type for potential type-specific fields
    const selectedType = watch('type_name') as CharacterizationType;
    const selectedUserIds = watch('user_ids');

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = parseInt(e.target.value);
        if (userId && !selectedUserIds?.includes(userId)) {
            setValue('user_ids', [...(selectedUserIds || []), userId]);
        }
        e.target.value = '';
    };

    const removeUser = (userId: number) => {
        setValue('user_ids', (selectedUserIds || []).filter(id => id !== userId));
    };

    // Pre-populate form when editing
    useEffect(() => {
        if (char) {
            reset({
                type_name: char.type_name,
                description: char.description || '',
                raw_data_id: char.raw_data_id,
                processed_data_id: char.processed_data_id,
                user_ids: char.users?.map(u => u.id) || [],
            });
        }
    }, [char, reset]);

    const onSubmit = async (data: CharacterizationCreate) => {
        // Clean up empty strings/arrays to undefined
        const cleanData: CharacterizationCreate = {
            ...data,
            description: data.description || undefined,
            user_ids: data.user_ids?.length ? data.user_ids : undefined,
        };

        // Add prefilled relationships for new characterizations
        if (!isEditing) {
            if (prefilledCatalystId) {
                cleanData.catalyst_ids = [parseInt(prefilledCatalystId)];
            }
            if (prefilledSampleId) {
                cleanData.sample_ids = [parseInt(prefilledSampleId)];
            }
        }

        if (isEditing && char) {
            const updateData: CharacterizationUpdate = {
                type_name: cleanData.type_name,
                description: cleanData.description,
                raw_data_id: cleanData.raw_data_id,
                processed_data_id: cleanData.processed_data_id,
                user_ids: cleanData.user_ids,
            };
            updateMutation.mutate(
                { id: char.id, data: updateData },
                {
                    onSuccess: async (updated) => {
                        navigate(`/characterizations/${updated.id}`);
                    },
                }
            );
        } else {
            createMutation.mutate(cleanData, {
                onSuccess: async (newChar) => {
                    navigate(`/characterizations/${newChar.id}`);
                },
            });
        }
    };

    if (isEditing && isLoadingChar) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading characterization...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isEditing ? 'Edit Characterization' : 'Add Characterization'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update characterization details and data files'
                        : 'Record a new analytical measurement'}
                </p>
            </div>

            {/* Context Banner */}
            {(prefilledSampleId || prefilledCatalystId) && !isEditing && (
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--spacing-lg)',
                        backgroundColor: 'var(--color-info)',
                        color: 'white',
                    }}
                >
                    <p style={{ margin: 0 }}>
                        This characterization will be linked to{' '}
                        {prefilledSampleId ? `Sample #${prefilledSampleId}` : `Catalyst #${prefilledCatalystId}`}
                        {' '}after creation.
                    </p>
                </div>
            )}

            <div className="card" style={{ maxWidth: '700px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Type Name (Characterization Type) */}
                    <FormField
                        label="Characterization Type"
                        error={errors.type_name?.message}
                        required
                    >
                        <Select
                            {...register('type_name', {
                                required: 'Type is required',
                            })}
                            hasError={!!errors.type_name}
                        >
                            {CHARACTERIZATION_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {CHARACTERIZATION_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </Select>
                    </FormField>

                    {/* Type-specific hint */}
                    <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <strong>{selectedType}:</strong>{' '}
                        {getTypeDescription(selectedType)}
                    </div>

                    {/* Description (includes conditions, equipment, notes) */}
                    <FormField
                        label="Description"
                        error={errors.description?.message}
                    >
                        <TextArea
                            {...register('description')}
                            placeholder="Include equipment used, measurement conditions, and any additional notes. e.g., Bruker D8 Advance, Cu Kα radiation, 2θ = 10-80°, 0.02°/step"
                            rows={4}
                        />
                    </FormField>

                    {/* Performed By (Users) */}
                    <FormField
                        label="Performed By"
                        error={errors.user_ids?.message}
                    >
                        <Select onChange={handleUserSelect} value="">
                            <option value="">Add a researcher...</option>
                            {users?.filter(u => !selectedUserIds?.includes(u.id)).map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.username}
                                </option>
                            ))}
                        </Select>
                        {selectedUserIds && selectedUserIds.length > 0 && (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginTop: 'var(--spacing-sm)' }}>
                                {selectedUserIds.map(userId => {
                                    const user = users?.find(u => u.id === userId);
                                    return (
                                        <span
                                            key={userId}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-xs)',
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--border-radius)',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {user?.full_name || user?.username || `User ${userId}`}
                                            <button
                                                type="button"
                                                onClick={() => removeUser(userId)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: '1rem',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                x
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </FormField>

                    {/* Data Files Section */}
                    <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                            Data Files
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Raw Data File */}
                        <FormField
                            label="Raw Data File"
                            error={errors.raw_data_id?.message}
                        >
                            <Select
                                {...register('raw_data_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">No file selected</option>
                                {files?.map((file) => (
                                    <option key={file.id} value={file.id}>
                                        {file.filename}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        {/* Processed Data File */}
                        <FormField
                            label="Processed Data File"
                            error={errors.processed_data_id?.message}
                        >
                            <Select
                                {...register('processed_data_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">No file selected</option>
                                {files?.map((file) => (
                                    <option key={file.id} value={file.id}>
                                        {file.filename}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(isEditing ? `/characterizations/${id}` : '/characterizations')}
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
                                    : 'Create Characterization'}
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

/**
 * Get a brief description for each characterization type
 */
function getTypeDescription(type: CharacterizationType): string {
    const descriptions: Record<CharacterizationType, string> = {
        XRD: 'Crystalline structure and phase identification',
        BET: 'Surface area and porosity analysis',
        TEM: 'High-resolution imaging of nanostructures',
        SEM: 'Surface morphology and topography',
        FTIR: 'Functional group identification via IR absorption',
        XPS: 'Surface composition and chemical states',
        TPR: 'Reducibility and metal-support interactions',
        TGA: 'Thermal stability and composition changes',
        UV_VIS: 'Electronic transitions and band gap analysis',
        RAMAN: 'Molecular vibrations and structural information',
        ICP_OES: 'Elemental composition quantification',
        CHNS: 'Carbon, hydrogen, nitrogen, sulfur content',
        NMR: 'Molecular structure via nuclear spin',
        GC: 'Volatile compound separation and analysis',
        HPLC: 'Liquid-phase compound separation',
        MS: 'Molecular weight and fragmentation patterns',
        OTHER: 'Other characterization technique',
    };
    return descriptions[type];
}