/**
 * WaveformFormPage - Form for creating and editing waveforms.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useWaveform, useCreateWaveform, useUpdateWaveform } from '@/hooks/useWaveforms';
import { FormField, TextInput, Button } from '@/components/common';
import type { WaveformCreate } from '@/services/api';

export const WaveformFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: waveform, isLoading: isLoadingWaveform } = useWaveform(
        id ? parseInt(id) : undefined
    );

    const createMutation = useCreateWaveform();
    const updateMutation = useUpdateWaveform();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<WaveformCreate>({
        defaultValues: {
            name: '',
            ac_frequency: '',
            ac_duty_cycle: '',
            pulsing_frequency: '',
            pulsing_duty_cycle: '',
        },
    });

    useEffect(() => {
        if (waveform) {
            reset({
                name: waveform.name,
                ac_frequency: waveform.ac_frequency || '',
                ac_duty_cycle: waveform.ac_duty_cycle || '',
                pulsing_frequency: waveform.pulsing_frequency || '',
                pulsing_duty_cycle: waveform.pulsing_duty_cycle || '',
            });
        }
    }, [waveform, reset]);

    const onSubmit = async (data: WaveformCreate) => {
        // Clean up empty strings to undefined
        const cleanData: WaveformCreate = {
            name: data.name,
            ac_frequency: data.ac_frequency || undefined,
            ac_duty_cycle: data.ac_duty_cycle || undefined,
            pulsing_frequency: data.pulsing_frequency || undefined,
            pulsing_duty_cycle: data.pulsing_duty_cycle || undefined,
        };

        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: cleanData,
                });
                navigate(`/waveforms/${id}`);
            } else {
                const newWaveform = await createMutation.mutateAsync(cleanData);
                navigate(`/waveforms/${newWaveform.id}`);
            }
        } catch (error) {
            console.error('Failed to save waveform:', error);
        }
    };

    if (isEditing && isLoadingWaveform) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading waveform...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/waveforms"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Waveforms
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Waveform' : 'Add New Waveform'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update waveform configuration'
                        : 'Add a new electrical signal configuration for plasma experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Waveform Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., AC 10kHz 50%, Pulsed 1kHz 20%"
                        />
                    </FormField>

                    <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>AC Parameters</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0 0' }}>
                            Configuration for the AC driving signal
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <FormField
                            label="AC Frequency (Hz)"
                            error={errors.ac_frequency?.message}
                            helpText="Driving frequency in Hz"
                        >
                            <TextInput
                                {...register('ac_frequency', {
                                    validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                                })}
                                placeholder="e.g., 10000"
                            />
                        </FormField>

                        <FormField
                            label="AC Duty Cycle (%)"
                            error={errors.ac_duty_cycle?.message}
                            helpText="Duty cycle percentage (0-100)"
                        >
                            <TextInput
                                {...register('ac_duty_cycle', {
                                    validate: (v) => {
                                        if (!v) return true;
                                        const val = parseFloat(v);
                                        if (isNaN(val)) return 'Must be a number';
                                        if (val < 0 || val > 100) return 'Must be between 0 and 100';
                                        return true;
                                    },
                                })}
                                placeholder="e.g., 50"
                            />
                        </FormField>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Pulsing Parameters</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0 0' }}>
                            Configuration for pulsed operation (optional)
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <FormField
                            label="Pulsing Frequency (Hz)"
                            error={errors.pulsing_frequency?.message}
                            helpText="Pulse modulation frequency in Hz"
                        >
                            <TextInput
                                {...register('pulsing_frequency', {
                                    validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                                })}
                                placeholder="e.g., 1000"
                            />
                        </FormField>

                        <FormField
                            label="Pulsing Duty Cycle (%)"
                            error={errors.pulsing_duty_cycle?.message}
                            helpText="Pulse duty cycle percentage (0-100)"
                        >
                            <TextInput
                                {...register('pulsing_duty_cycle', {
                                    validate: (v) => {
                                        if (!v) return true;
                                        const val = parseFloat(v);
                                        if (isNaN(val)) return 'Must be a number';
                                        if (val < 0 || val > 100) return 'Must be between 0 and 100';
                                        return true;
                                    },
                                })}
                                placeholder="e.g., 20"
                            />
                        </FormField>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Waveform'
                                    : 'Create Waveform'}
                        </Button>
                        <Link to="/waveforms">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving waveform. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};