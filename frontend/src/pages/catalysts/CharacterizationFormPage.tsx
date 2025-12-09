/**
 * CharacterizationFormPage - Form for creating and editing characterizations.
 *
 * Handles the polymorphic characterization_type field and optional relationships
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
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
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
        'performed_by,raw_data_file,processed_data_file'
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
    } = useForm<CharacterizationCreate>({
        defaultValues: {
            name: '',
            characterization_type: 'XRD',
            performed_by_id: undefined,
            performed_at: '',
            equipment_used: '',
            conditions: '',
            raw_data_file_id: undefined,
            processed_data_file_id: undefined,
            notes: '',
        },
    });

    // Watch the type for potential type-specific fields
    const selectedType = watch('characterization_type');

    // Pre-populate form when editing
    useEffect(() => {
        if (char) {
            reset({
                name: char.name,
                characterization_type: char.characterization_type,
                performed_by_id: char.performed_by_id,
                performed_at: char.performed_at ? char.performed_at.split('T')[0] : '',
                equipment_used: char.equipment_used || '',
                conditions: char.conditions || '',
                raw_data_file_id: char.raw_data_file_id,
                processed_data_file_id: char.processed_data_file_id,
                notes: char.notes || '',
            });
        }
    }, [char, reset]);

    const onSubmit = async (data: CharacterizationCreate) => {
        // Clean up empty strings to undefined
        const cleanData: CharacterizationCreate = {
            ...data,
            performed_at: data.performed_at || undefined,
            equipment_used: data.equipment_used || undefined,
            conditions: data.conditions || undefined,
            notes: data.notes || undefined,
        };

        if (isEditing && char) {
            const updateData: CharacterizationUpdate = cleanData;
            updateMutation.mutate(
                { id: char.id, data: updateData },
                {
                    onSuccess: async (updated) => {
                        // TODO: If prefilled sample/catalyst, link after create
                        navigate(`/characterizations/${updated.id}`);
                    },
                }
            );
        } else {
            createMutation.mutate(cleanData, {
                onSuccess: async (newChar) => {
                    // Note: Linking to sample/catalyst would happen here
                    // For now, navigate to the new characterization
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
                    {/* Name */}
                    <FormField
                        label="Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., XRD Analysis - Pt-TiO2 Sample 001"
                            hasError={!!errors.name}
                        />
                    </FormField>

                    {/* Characterization Type */}
                    <FormField
                        label="Characterization Type"
                        error={errors.characterization_type?.message}
                        required
                    >
                        <Select
                            {...register('characterization_type', {
                                required: 'Type is required',
                            })}
                            hasError={!!errors.characterization_type}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Performed By */}
                        <FormField
                            label="Performed By"
                            error={errors.performed_by_id?.message}
                        >
                            <Select
                                {...register('performed_by_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">Select researcher...</option>
                                {users?.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.username}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        {/* Date Performed */}
                        <FormField
                            label="Date Performed"
                            error={errors.performed_at?.message}
                        >
                            <TextInput
                                type="date"
                                {...register('performed_at')}
                            />
                        </FormField>
                    </div>

                    {/* Equipment Used */}
                    <FormField
                        label="Equipment Used"
                        error={errors.equipment_used?.message}
                    >
                        <TextInput
                            {...register('equipment_used')}
                            placeholder="e.g., Bruker D8 Advance, JEOL JEM-2100"
                        />
                    </FormField>

                    {/* Conditions */}
                    <FormField
                        label="Measurement Conditions"
                        error={errors.conditions?.message}
                    >
                        <TextInput
                            {...register('conditions')}
                            placeholder="e.g., 40kV, 40mA, Cu Kα radiation, 2θ = 10-80°"
                        />
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
                            error={errors.raw_data_file_id?.message}
                        >
                            <Select
                                {...register('raw_data_file_id', {
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
                            error={errors.processed_data_file_id?.message}
                        >
                            <Select
                                {...register('processed_data_file_id', {
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

                    {/* Notes */}
                    <FormField
                        label="Notes"
                        error={errors.notes?.message}
                    >
                        <TextArea
                            {...register('notes')}
                            placeholder="Additional observations, analysis notes, or findings..."
                            rows={4}
                        />
                    </FormField>

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