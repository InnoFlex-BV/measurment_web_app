/**
 * ProcessedFormPage - Form for creating and editing processed results.
 *
 * Handles DRE and EY metric input with validation.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    useProcessedResult,
    useCreateProcessed,
    useUpdateProcessed,
} from '@/hooks/useProcessed';
import { FormField, TextInput, Button } from '@/components/common';
import type { ProcessedCreate } from '@/services/api';

interface ProcessedFormData {
    dre: string;
    ey: string;
}

export const ProcessedFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    // Fetch existing result if editing
    const { data: result, isLoading: isLoadingResult } = useProcessedResult(
        id ? parseInt(id) : undefined
    );

    // Mutations
    const createMutation = useCreateProcessed();
    const updateMutation = useUpdateProcessed();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<ProcessedFormData>({
        defaultValues: {
            dre: '',
            ey: '',
        },
    });

    // Watch values for preview
    const watchedDre = watch('dre');
    const watchedEy = watch('ey');

    // Populate form when editing
    useEffect(() => {
        if (result) {
            reset({
                dre: result.dre || '',
                ey: result.ey || '',
            });
        }
    }, [result, reset]);

    const onSubmit = async (data: ProcessedFormData) => {
        try {
            // Build create/update data - convert empty strings to undefined
            const submitData: ProcessedCreate = {
                dre: data.dre ? parseFloat(data.dre) : undefined,
                ey: data.ey ? parseFloat(data.ey) : undefined,
            };

            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: submitData,
                });
                navigate(`/processed/${id}`);
            } else {
                const newResult = await createMutation.mutateAsync(submitData);
                navigate(`/processed/${newResult.id}`);
            }
        } catch (error) {
            console.error('Failed to save processed result:', error);
        }
    };

    /**
     * Get DRE rating for preview
     */
    const getDreRating = (value: string): { label: string; color: string } | null => {
        if (!value) return null;
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        if (num >= 90) return { label: 'Excellent', color: 'var(--color-success)' };
        if (num >= 80) return { label: 'Good', color: '#22c55e' };
        if (num >= 50) return { label: 'Moderate', color: 'var(--color-warning)' };
        return { label: 'Low', color: 'var(--color-danger)' };
    };

    // Loading state for edit mode
    if (isEditing && isLoadingResult) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading processed result...</p>
                </div>
            </div>
        );
    }

    const dreRating = getDreRating(watchedDre);
    const hasValues = watchedDre || watchedEy;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <Link
                    to="/processed"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Results
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Processed Result' : 'New Processed Result'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update calculated performance metrics'
                        : 'Record DRE and Energy Yield from experiment data'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Performance Metrics
                        </h2>

                        <FormField
                            label="Decomposition/Removal Efficiency (DRE)"
                            error={errors.dre?.message}
                            helpText="Percentage of contaminant decomposed (0-100)"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <TextInput
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 85.5"
                                    {...register('dre', {
                                        validate: (value) => {
                                            if (!value) return true; // Optional
                                            const num = parseFloat(value);
                                            if (isNaN(num)) return 'Must be a valid number';
                                            if (num < 0) return 'Cannot be negative';
                                            if (num > 100) return 'Cannot exceed 100%';
                                            return true;
                                        },
                                    })}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>%</span>
                            </div>
                        </FormField>

                        <FormField
                            label="Energy Yield (EY)"
                            error={errors.ey?.message}
                            helpText="Mass decomposed per unit energy (g/kWh)"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <TextInput
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    placeholder="e.g., 12.3"
                                    {...register('ey', {
                                        validate: (value) => {
                                            if (!value) return true; // Optional
                                            const num = parseFloat(value);
                                            if (isNaN(num)) return 'Must be a valid number';
                                            if (num < 0) return 'Cannot be negative';
                                            return true;
                                        },
                                    })}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>g/kWh</span>
                            </div>
                        </FormField>

                        {/* Info Box */}
                        <div
                            style={{
                                marginTop: 'var(--spacing-lg)',
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--border-radius)',
                                fontSize: '0.875rem',
                            }}
                        >
                            <p style={{ margin: '0 0 var(--spacing-sm) 0', fontWeight: 500 }}>
                                💡 Tips
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                <li>Both fields are optional - you can record partial results</li>
                                <li>DRE values typically range from 0-100%</li>
                                <li>Higher EY values indicate more energy-efficient processes</li>
                                <li>Link experiments to results after creation</li>
                            </ul>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Result'
                                    : 'Create Result'}
                        </Button>
                        <Link to="/processed">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {/* Error Display */}
                    {(createMutation.isError || updateMutation.isError) && (
                        <div
                            className="card"
                            style={{
                                marginTop: 'var(--spacing-md)',
                                backgroundColor: 'var(--color-danger)',
                                color: 'white',
                            }}
                        >
                            Error saving result. Please try again.
                        </div>
                    )}
                </form>

                {/* Live Preview */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: 'var(--spacing-lg)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Preview
                        </h3>

                        {hasValues ? (
                            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                {/* DRE Preview */}
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        DRE
                                    </p>
                                    {watchedDre ? (
                                        <div>
                                            <span style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: dreRating?.color || 'inherit',
                                            }}>
                                                {parseFloat(watchedDre).toFixed(2)}%
                                            </span>
                                            {dreRating && (
                                                <span style={{
                                                    marginLeft: 'var(--spacing-sm)',
                                                    fontSize: '0.875rem',
                                                    color: dreRating.color,
                                                    fontWeight: 500,
                                                }}>
                                                    {dreRating.label}
                                                </span>
                                            )}
                                            {/* Mini progress bar */}
                                            <div
                                                style={{
                                                    marginTop: 'var(--spacing-xs)',
                                                    height: '4px',
                                                    backgroundColor: 'var(--color-bg-secondary)',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${Math.min(parseFloat(watchedDre) || 0, 100)}%`,
                                                        height: '100%',
                                                        backgroundColor: dreRating?.color || 'var(--color-primary)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                    )}
                                </div>

                                {/* EY Preview */}
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Energy Yield
                                    </p>
                                    {watchedEy ? (
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                            {parseFloat(watchedEy).toFixed(2)} g/kWh
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div style={{
                                    padding: 'var(--spacing-sm)',
                                    backgroundColor: (watchedDre && watchedEy)
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: 'var(--border-radius)',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: (watchedDre && watchedEy)
                                        ? 'var(--color-success)'
                                        : 'var(--color-warning)',
                                }}>
                                    {(watchedDre && watchedEy) ? '✓ Complete' : '⚠ Partial'}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                                Enter values to see preview
                            </p>
                        )}
                    </div>

                    {/* Reference Guide */}
                    <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                            DRE Reference
                        </h3>
                        <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                                <span>≥90%: Excellent</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                                <span>80-90%: Good</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                                <span>50-80%: Moderate</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
                                <span>&lt;50%: Low</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};