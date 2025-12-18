/**
 * ProcessedFormPage - Form for creating and editing processed results.
 *
 * Handles DRE and EY metric input with validation.
 * Supports linking experiments during creation or editing.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    useProcessedResult,
    useCreateProcessed,
    useUpdateProcessed,
} from '@/hooks/useProcessed';
import { useExperiments } from '@/hooks/useExperiments';
import { FormField, TextInput, Button, Badge } from '@/components/common';
import { EXPERIMENT_TYPE_LABELS, type ExperimentType, type ProcessedCreate } from '@/services/api';

interface ProcessedFormData {
    dre: string;
    ey: string;
}

/**
 * Get badge variant based on experiment type
 */
function getExperimentTypeBadgeVariant(type: ExperimentType): 'info' | 'success' | 'warning' {
    switch (type) {
        case 'plasma': return 'info';
        case 'photocatalysis': return 'success';
        case 'misc': return 'warning';
    }
}

export const ProcessedFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    // State for selected experiments
    const [selectedExperimentIds, setSelectedExperimentIds] = useState<number[]>([]);
    const [experimentSearch, setExperimentSearch] = useState('');

    // Fetch existing result if editing (with experiments)
    const { data: result, isLoading: isLoadingResult } = useProcessedResult(
        id ? parseInt(id) : undefined,
        'experiments'
    );

    // Fetch all experiments for selection
    const { data: experiments, isLoading: isLoadingExperiments } = useExperiments({});

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
            // Set selected experiments from existing linked experiments
            if (result.experiments) {
                setSelectedExperimentIds(result.experiments.map(e => e.id));
            }
        }
    }, [result, reset]);

    // Filter experiments based on search
    const filteredExperiments = useMemo(() => {
        if (!experiments) return [];
        if (!experimentSearch) return experiments;

        const search = experimentSearch.toLowerCase();
        return experiments.filter(exp =>
            exp.name.toLowerCase().includes(search) ||
            exp.purpose.toLowerCase().includes(search) ||
            exp.experiment_type.toLowerCase().includes(search)
        );
    }, [experiments, experimentSearch]);

    // Toggle experiment selection
    const handleExperimentToggle = (expId: number) => {
        setSelectedExperimentIds(prev =>
            prev.includes(expId)
                ? prev.filter(id => id !== expId)
                : [...prev, expId]
        );
    };

    // Select/deselect all filtered experiments
    const handleSelectAll = () => {
        const filteredIds = filteredExperiments.map(e => e.id);
        const allSelected = filteredIds.every(id => selectedExperimentIds.includes(id));

        if (allSelected) {
            // Deselect all filtered
            setSelectedExperimentIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // Select all filtered
            setSelectedExperimentIds(prev => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const onSubmit = async (data: ProcessedFormData) => {
        try {
            // Build create/update data
            const submitData: ProcessedCreate = {
                dre: data.dre ? parseFloat(data.dre) : undefined,
                ey: data.ey ? parseFloat(data.ey) : undefined,
                experiment_ids: selectedExperimentIds.length > 0 ? selectedExperimentIds : undefined,
            };

            if (isEditing && id) {
                // For update, always include experiment_ids to handle unlinking
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: {
                        ...submitData,
                        experiment_ids: selectedExperimentIds, // Include even if empty to unlink all
                    },
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
                        ? 'Update calculated performance metrics and linked experiments'
                        : 'Record DRE and Energy Yield from experiment data'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Performance Metrics Card */}
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
                    </div>

                    {/* Linked Experiments Card */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                Linked Experiments ({selectedExperimentIds.length})
                            </h2>
                            {selectedExperimentIds.length > 0 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedExperimentIds([])}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            Select experiments to associate with this processed result.
                            {isEditing && ' Changing selection will update all experiment links.'}
                        </p>

                        {/* Search and Select All */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            <TextInput
                                type="text"
                                placeholder="Search experiments by name, purpose, or type..."
                                value={experimentSearch}
                                onChange={(e) => setExperimentSearch(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={filteredExperiments.length === 0}
                            >
                                {filteredExperiments.every(e => selectedExperimentIds.includes(e.id))
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>

                        {/* Experiment List */}
                        {isLoadingExperiments ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>Loading experiments...</p>
                        ) : !experiments || experiments.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>No experiments available.</p>
                        ) : filteredExperiments.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>No experiments match your search.</p>
                        ) : (
                            <div
                                style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--border-radius)',
                                }}
                            >
                                {filteredExperiments.map((experiment) => {
                                    const isSelected = selectedExperimentIds.includes(experiment.id);
                                    return (
                                        <div
                                            key={experiment.id}
                                            onClick={() => handleExperimentToggle(experiment.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                borderBottom: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                transition: 'background-color 0.15s',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = isSelected
                                                    ? 'rgba(99, 102, 241, 0.1)'
                                                    : 'transparent';
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}} // Handled by parent onClick
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    <span style={{
                                                        fontWeight: 500,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {experiment.name}
                                                    </span>
                                                    <Badge
                                                        variant={getExperimentTypeBadgeVariant(experiment.experiment_type as ExperimentType)}
                                                        size="sm"
                                                    >
                                                        {EXPERIMENT_TYPE_LABELS[experiment.experiment_type as ExperimentType]}
                                                    </Badge>
                                                </div>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-secondary)',
                                                    margin: '0.125rem 0 0 0',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {experiment.purpose}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <span style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>✓</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Selected Count */}
                        {selectedExperimentIds.length > 0 && (
                            <p style={{
                                marginTop: 'var(--spacing-sm)',
                                fontSize: '0.875rem',
                                color: 'var(--color-primary)',
                                fontWeight: 500,
                            }}>
                                {selectedExperimentIds.length} experiment{selectedExperimentIds.length !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div
                        className="card"
                        style={{
                            marginTop: 'var(--spacing-lg)',
                            backgroundColor: 'var(--color-bg-secondary)',
                        }}
                    >
                        <p style={{ margin: '0 0 var(--spacing-sm) 0', fontWeight: 500 }}>
                            💡 Tips
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-md)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            <li>Both DRE and EY fields are optional - you can record partial results</li>
                            <li>DRE values typically range from 0-100%</li>
                            <li>Higher EY values indicate more energy-efficient processes</li>
                            <li>Link experiments to track which data produced these results</li>
                            {isEditing && (
                                <li>Changing experiment selection will update all links (previous links will be removed)</li>
                            )}
                        </ul>
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

                {/* Live Preview Sidebar */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: 'var(--spacing-lg)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Preview
                        </h3>

                        {hasValues || selectedExperimentIds.length > 0 ? (
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

                                {/* Linked Experiments Preview */}
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Linked Experiments
                                    </p>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                        {selectedExperimentIds.length}
                                    </span>
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
