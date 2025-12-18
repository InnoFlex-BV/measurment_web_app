/**
 * ProcessedDetailPage - Detail view for a single processed result.
 *
 * Displays calculated metrics (DRE, EY) and linked experiments.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProcessedResult, useDeleteProcessed } from '@/hooks/useProcessed';
import { Button, Badge } from '@/components/common';
import { EXPERIMENT_TYPE_LABELS, type ExperimentType } from '@/services/api';

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

export const ProcessedDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const processedId = id ? parseInt(id) : undefined;

    const { data: result, isLoading, error } = useProcessedResult(processedId, 'experiments');
    const deleteMutation = useDeleteProcessed();

    const handleDelete = () => {
        if (!result) return;

        if (window.confirm(`Are you sure you want to delete processed result #${result.id}?`)) {
            deleteMutation.mutate(result.id, {
                onSuccess: () => {
                    navigate('/processed');
                },
            });
        }
    };

    /**
     * Format decimal value for display with specified precision
     */
    const formatValue = (value: string | null | undefined, precision: number = 4): string => {
        if (value === null || value === undefined) return '—';
        const num = parseFloat(value);
        return isNaN(num) ? '—' : num.toFixed(precision);
    };

    /**
     * Get performance rating based on DRE value
     */
    const getDreRating = (dre: string | null | undefined): { label: string; color: string; description: string } => {
        if (!dre) return { label: 'Not Measured', color: 'var(--color-text-secondary)', description: 'DRE value not recorded' };
        const value = parseFloat(dre);
        if (isNaN(value)) return { label: 'Invalid', color: 'var(--color-text-secondary)', description: 'Invalid DRE value' };
        if (value >= 90) return { label: 'Excellent', color: 'var(--color-success)', description: '≥90% decomposition efficiency' };
        if (value >= 80) return { label: 'Good', color: '#22c55e', description: '80-90% decomposition efficiency' };
        if (value >= 50) return { label: 'Moderate', color: 'var(--color-warning)', description: '50-80% decomposition efficiency' };
        return { label: 'Low', color: 'var(--color-danger)', description: '<50% decomposition efficiency' };
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading processed result...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Processed result not found or error loading data.</p>
                    <Link to="/processed">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Results
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const dreRating = getDreRating(result.dre);

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Link
                        to="/processed"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Results
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>
                            Processed Result #{result.id}
                        </h1>
                        <Badge variant={result.is_complete ? 'success' : 'warning'}>
                            {result.is_complete ? 'Complete' : 'Partial'}
                        </Badge>
                    </div>
                    <p className="page-description">Calculated performance metrics</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/processed/${result.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Main Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
                {/* DRE Card */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        Decomposition/Removal Efficiency (DRE)
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-sm)' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace', color: dreRating.color }}>
                            {formatValue(result.dre, 2)}
                        </span>
                        {result.has_dre && (
                            <span style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>%</span>
                        )}
                    </div>
                    <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: dreRating.color,
                            }}
                        />
                        <span style={{ fontWeight: 500 }}>{dreRating.label}</span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            — {dreRating.description}
                        </span>
                    </div>

                    {/* Visual Progress Bar */}
                    {result.has_dre && (
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <div
                                style={{
                                    height: '8px',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.min(parseFloat(result.dre || '0'), 100)}%`,
                                        height: '100%',
                                        backgroundColor: dreRating.color,
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* EY Card */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        Energy Yield (EY)
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-sm)' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace' }}>
                            {formatValue(result.ey, 2)}
                        </span>
                        {result.has_ey && (
                            <span style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>g/kWh</span>
                        )}
                    </div>
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        {result.has_ey
                            ? 'Mass of contaminant decomposed per unit energy consumed'
                            : 'Energy yield not recorded for this result'}
                    </p>
                </div>
            </div>

            {/* Status Summary */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Data Status
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: result.has_dre ? 'var(--color-success)' : 'var(--color-bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: result.has_dre ? 'white' : 'var(--color-text-secondary)',
                                fontSize: '0.75rem',
                            }}
                        >
                            {result.has_dre ? '✓' : '—'}
                        </div>
                        <span>DRE Recorded</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: result.has_ey ? 'var(--color-success)' : 'var(--color-bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: result.has_ey ? 'white' : 'var(--color-text-secondary)',
                                fontSize: '0.75rem',
                            }}
                        >
                            {result.has_ey ? '✓' : '—'}
                        </div>
                        <span>EY Recorded</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: result.is_complete ? 'var(--color-success)' : 'var(--color-warning)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem',
                            }}
                        >
                            {result.is_complete ? '✓' : '!'}
                        </div>
                        <span>{result.is_complete ? 'Complete' : 'Incomplete'}</span>
                    </div>
                </div>
            </div>

            {/* Linked Experiments */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Linked Experiments ({result.experiments?.length || 0})
                </h2>
                {result.experiments && result.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {result.experiments.map((experiment) => (
                            <Link
                                key={experiment.id}
                                to={`/experiments/${experiment.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                        {experiment.name}
                                    </span>
                                    <Badge variant={getExperimentTypeBadgeVariant(experiment.experiment_type)}>
                                        {EXPERIMENT_TYPE_LABELS[experiment.experiment_type]}
                                    </Badge>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    View →
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No experiments linked to this result yet.
                    </p>
                )}
            </div>

            {/* Usage Guide */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)', backgroundColor: 'var(--color-bg-secondary)' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                    About These Metrics
                </h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <p style={{ margin: '0 0 var(--spacing-sm) 0' }}>
                        <strong>DRE (Decomposition/Removal Efficiency)</strong>: The percentage of target contaminant
                        successfully decomposed or removed during the experiment. Higher values indicate better performance.
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>EY (Energy Yield)</strong>: The mass of contaminant decomposed per unit of electrical
                        energy consumed, typically expressed in g/kWh. Higher values indicate more energy-efficient processes.
                    </p>
                </div>
            </div>
        </div>
    );
};