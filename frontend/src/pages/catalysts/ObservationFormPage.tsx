/**
 * ObservationFormPage - Form for creating and editing observations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. This form handles the basic observation data; relationship
 * management is done from the detail page.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    useObservation,
    useCreateObservation,
    useUpdateObservation,
} from '@/hooks/useObservations';
import { useUsers } from '@/hooks/useUsers';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import type { ObservationCreate, ObservationUpdate } from '@/services/api';

/**
 * Common observation types for the dropdown.
 * These are suggestions - the field accepts any string value.
 */
const COMMON_OBSERVATION_TYPES = [
    'Visual',
    'Physical',
    'Chemical',
    'Thermal',
    'Mechanical',
    'Color Change',
    'Texture',
    'Odor',
    'Reaction',
    'Stability',
    'Aging',
    'Contamination',
    'Other',
];

export const ObservationFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id;

    // Pre-fill from URL params (when creating from sample/catalyst detail)
    const prefilledSampleId = searchParams.get('sample_id');
    const prefilledCatalystId = searchParams.get('catalyst_id');

    // Fetch existing observation if editing
    const { data: observation, isLoading: isLoadingObservation } = useObservation(
        id ? parseInt(id) : undefined,
        'observed_by'
    );

    // Fetch users for dropdown
    const { data: users } = useUsers({ is_active: true });

    // Mutations
    const createMutation = useCreateObservation();
    const updateMutation = useUpdateObservation();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = useForm<ObservationCreate>({
        defaultValues: {
            title: '',
            content: '',
            observation_type: '',
            observed_by_id: undefined,
            observed_at: '',
        },
    });

    // Watch for custom type input
    const selectedType = watch('observation_type');

    // Pre-populate form when editing
    useEffect(() => {
        if (observation) {
            reset({
                title: observation.title,
                content: observation.content,
                observation_type: observation.observation_type || '',
                observed_by_id: observation.observed_by_id,
                observed_at: observation.observed_at ? observation.observed_at.split('T')[0] : '',
            });
        }
    }, [observation, reset]);

    const onSubmit = async (data: ObservationCreate) => {
        // Clean up empty strings to undefined
        const cleanData: ObservationCreate = {
            ...data,
            observation_type: data.observation_type || undefined,
            observed_at: data.observed_at || undefined,
        };

        if (isEditing && observation) {
            const updateData: ObservationUpdate = cleanData;
            updateMutation.mutate(
                { id: observation.id, data: updateData },
                {
                    onSuccess: (updated) => {
                        navigate(`/observations/${updated.id}`);
                    },
                }
            );
        } else {
            createMutation.mutate(cleanData, {
                onSuccess: (newObservation) => {
                    // TODO: If prefilled sample/catalyst, link after create
                    // For now, navigate to the new observation
                    navigate(`/observations/${newObservation.id}`);
                },
            });
        }
    };

    if (isEditing && isLoadingObservation) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading observation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isEditing ? 'Edit Observation' : 'Add Observation'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update observation details'
                        : 'Record a new qualitative research note'}
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
                        This observation will be linked to{' '}
                        {prefilledSampleId ? `Sample #${prefilledSampleId}` : `Catalyst #${prefilledCatalystId}`}
                        {' '}after creation.
                    </p>
                </div>
            )}

            <div className="card" style={{ maxWidth: '700px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Title */}
                    <FormField
                        label="Title"
                        error={errors.title?.message}
                        required
                    >
                        <TextInput
                            {...register('title', {
                                required: 'Title is required',
                                minLength: { value: 1, message: 'Title cannot be empty' },
                            })}
                            placeholder="Brief descriptive title for this observation"
                            hasError={!!errors.title}
                        />
                    </FormField>

                    {/* Observation Type */}
                    <FormField
                        label="Observation Type"
                        error={errors.observation_type?.message}
                    >
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <Select
                                value={COMMON_OBSERVATION_TYPES.includes(selectedType || '') ? selectedType : ''}
                                onChange={(e) => setValue('observation_type', e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="">Select type or enter custom...</option>
                                {COMMON_OBSERVATION_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </Select>
                            <TextInput
                                {...register('observation_type')}
                                placeholder="Or type custom..."
                                style={{ flex: 1 }}
                            />
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Select a common type or enter your own
                        </p>
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Observed By */}
                        <FormField
                            label="Observed By"
                            error={errors.observed_by_id?.message}
                        >
                            <Select
                                {...register('observed_by_id', {
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

                        {/* Date Observed */}
                        <FormField
                            label="Date Observed"
                            error={errors.observed_at?.message}
                        >
                            <TextInput
                                type="date"
                                {...register('observed_at')}
                            />
                        </FormField>
                    </div>

                    {/* Content */}
                    <FormField
                        label="Content"
                        error={errors.content?.message}
                        required
                    >
                        <TextArea
                            {...register('content', {
                                required: 'Content is required',
                                minLength: { value: 1, message: 'Content cannot be empty' },
                            })}
                            placeholder="Detailed description of the observation. Include relevant conditions, measurements, visual descriptions, or any other pertinent information..."
                            rows={8}
                            hasError={!!errors.content}
                        />
                    </FormField>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(isEditing ? `/observations/${id}` : '/observations')}
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
                                    : 'Create Observation'}
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

            {/* Help Text */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)', maxWidth: '700px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    Tips for Good Observations
                </h3>
                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <li>Be specific and detailed in your descriptions</li>
                    <li>Include relevant environmental conditions (temperature, humidity, etc.)</li>
                    <li>Note any deviations from expected behavior</li>
                    <li>Record timestamps for time-sensitive observations</li>
                    <li>After creating, you can attach files and link to catalysts/samples from the detail page</li>
                </ul>
            </div>
        </div>
    );
};