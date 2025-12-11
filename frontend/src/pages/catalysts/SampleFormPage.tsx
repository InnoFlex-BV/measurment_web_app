/**
 * SampleFormPage - Form for creating and editing samples.
 *
 * Handles multiple relationship selections (catalyst, support, method, user)
 * and validates decimal amounts for inventory tracking.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSample, useCreateSample, useUpdateSample } from '@/hooks/useSamples';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useSupports } from '@/hooks/useSupports';
import { useMethods } from '@/hooks/useMethods';
import { useUsers } from '@/hooks/useUsers';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import type { SampleCreate, SampleUpdate } from '@/services/api';

export const SampleFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id;

    // Pre-fill catalyst from URL param (when creating from catalyst detail)
    const prefilledCatalystId = searchParams.get('catalyst_id');

    // Fetch existing sample if editing
    const { data: sample, isLoading: isLoadingSample } = useSample(
        id ? parseInt(id) : undefined,
        'catalyst,support,method,created_by'
    );

    // Fetch dropdown data
    const { data: catalysts } = useCatalysts({ depleted: false });
    const { data: supports } = useSupports();
    const { data: methods } = useMethods({ is_active: true });
    const { data: users } = useUsers({ is_active: true });

    // Mutations
    const createMutation = useCreateSample();
    const updateMutation = useUpdateSample();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<SampleCreate>({
        defaultValues: {
            name: '',
            catalyst_id: prefilledCatalystId ? parseInt(prefilledCatalystId) : undefined,
            support_id: undefined,
            method_id: undefined,
            created_by_id: undefined,
            yield_amount: '',
            remaining_amount: '',
            storage_location: '',
            notes: '',
        },
    });

    // Watch yield to sync with remaining on create
    const yieldAmount = watch('yield_amount');

    // Pre-populate form when editing
    useEffect(() => {
        if (sample) {
            reset({
                name: sample.name,
                catalyst_id: sample.catalyst_id,
                support_id: sample.support_id,
                method_id: sample.method_id,
                created_by_id: sample.created_by_id,
                yield_amount: sample.yield_amount,
                remaining_amount: sample.remaining_amount,
                storage_location: sample.storage_location,
                notes: sample.notes || '',
            });
        }
    }, [sample, reset]);

    const onSubmit = (data: SampleCreate) => {
        // Ensure remaining_amount is set on create
        const submitData: SampleCreate = {
            ...data,
            remaining_amount: data.remaining_amount || data.yield_amount,
        };

        if (isEditing && sample) {
            const updateData: SampleUpdate = {
                name: data.name,
                catalyst_id: data.catalyst_id,
                support_id: data.support_id,
                method_id: data.method_id,
                yield_amount: data.yield_amount,
                remaining_amount: data.remaining_amount,
                storage_location: data.storage_location,
                notes: data.notes || undefined,
            };
            updateMutation.mutate(
                { id: sample.id, data: updateData },
                { onSuccess: () => navigate(`/samples/${sample.id}`) }
            );
        } else {
            createMutation.mutate(submitData, {
                onSuccess: (newSample) => navigate(`/samples/${newSample.id}`),
            });
        }
    };

    if (isEditing && isLoadingSample) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading sample...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isEditing ? 'Edit Sample' : 'Create Sample'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update sample information and inventory'
                        : 'Prepare a new sample from catalyst material'}
                </p>
            </div>

            <div className="card" style={{ maxWidth: '700px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Name */}
                    <FormField
                        label="Sample Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Sample name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Pt-TiO2-Sample-001"
                            hasError={!!errors.name}
                        />
                    </FormField>

                    {/* Source Relationships */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Source Catalyst */}
                        <FormField
                            label="Source Catalyst"
                            error={errors.catalyst_id?.message}
                        >
                            <Select
                                {...register('catalyst_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">None (standalone sample)</option>
                                {catalysts?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        {/* Support Material */}
                        <FormField
                            label="Support Material"
                            error={errors.support_id?.message}
                        >
                            <Select
                                {...register('support_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">None</option>
                                {supports?.map((sup) => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.descriptive_name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Preparation Method */}
                        <FormField
                            label="Preparation Method"
                            error={errors.method_id?.message}
                        >
                            <Select
                                {...register('method_id', {
                                    setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                                })}
                            >
                                <option value="">None</option>
                                {methods?.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.descriptive_name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        {/* Created By (only on create) */}
                        {!isEditing && (
                            <FormField
                                label="Created By"
                                error={errors.created_by_id?.message}
                            >
                                <Select
                                    {...register('created_by_id', {
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
                        )}
                    </div>

                    {/* Inventory Section */}
                    <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                            Inventory
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        {/* Yield Amount */}
                        <FormField
                            label="Total Yield (g)"
                            error={errors.yield_amount?.message}
                            required
                        >
                            <TextInput
                                type="text"
                                {...register('yield_amount', {
                                    required: 'Yield amount is required',
                                    pattern: {
                                        value: /^\d*\.?\d+$/,
                                        message: 'Must be a valid decimal number',
                                    },
                                })}
                                placeholder="0.00"
                                hasError={!!errors.yield_amount}
                            />
                        </FormField>

                        {/* Remaining Amount */}
                        <FormField
                            label="Remaining Amount (g)"
                            error={errors.remaining_amount?.message}
                            required={isEditing}
                        >
                            <TextInput
                                type="text"
                                {...register('remaining_amount', {
                                    required: isEditing ? 'Remaining amount is required' : false,
                                    pattern: {
                                        value: /^\d*\.?\d+$/,
                                        message: 'Must be a valid decimal number',
                                    },
                                    validate: (value) => {
                                        if (!value && !isEditing) return true; // Will use yield on create
                                        const remaining = parseFloat(value as string);
                                        const total = parseFloat(yieldAmount as string);
                                        if (isNaN(remaining) || isNaN(total)) return true;
                                        if (remaining > total) return 'Remaining cannot exceed yield';
                                        return true;
                                    },
                                })}
                                placeholder={isEditing ? '0.00' : 'Same as yield if empty'}
                                hasError={!!errors.remaining_amount}
                            />
                        </FormField>
                    </div>

                    {/* Storage Location */}
                    <FormField
                        label="Storage Location"
                        error={errors.storage_location?.message}
                        required
                    >
                        <TextInput
                            {...register('storage_location', {
                                required: 'Storage location is required',
                            })}
                            placeholder="e.g., Lab A, Cabinet 3, Shelf 2"
                            hasError={!!errors.storage_location}
                        />
                    </FormField>

                    {/* Preparation Notes */}
                    <FormField
                        label="Preparation Notes"
                        error={errors.notes?.message}
                    >
                        <TextArea
                            {...register('notes')}
                            placeholder="Any additional notes about sample preparation..."
                            rows={4}
                        />
                    </FormField>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(isEditing ? `/samples/${id}` : '/samples')}
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
                                    : 'Create Sample'}
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