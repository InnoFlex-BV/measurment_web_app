/**
 * AnalyzerDetailPage - Detail view for a single analyzer.
 *
 * Displays type-specific fields for FTIR and OES analyzers.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAnalyzer, useDeleteAnalyzer } from '@/hooks/useAnalyzers';
import { Button, Badge } from '@/components/common';
import {
    ANALYZER_TYPE_LABELS,
    EXPERIMENT_TYPE_LABELS,
    type ExperimentType,
    isFTIRAnalyzer,
    isOESAnalyzer,
} from '@/services/api';
import { format } from 'date-fns';

export const AnalyzerDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const analyzerId = id ? parseInt(id) : undefined;

    const { data: analyzer, isLoading, error } = useAnalyzer(analyzerId, 'experiments');
    const deleteMutation = useDeleteAnalyzer();

    const handleDelete = () => {
        if (!analyzer) return;

        if (window.confirm(`Are you sure you want to delete analyzer "${analyzer.name}"?`)) {
            deleteMutation.mutate({ id: analyzer.id }, {
                onSuccess: () => {
                    navigate('/analyzers');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading analyzer...</p>
                </div>
            </div>
        );
    }

    if (error || !analyzer) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Analyzer not found or error loading data.</p>
                    <Link to="/analyzers">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Analyzers
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
                    <Link
                        to="/analyzers"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Analyzers
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>
                            {analyzer.name}
                        </h1>
                        <Badge variant={analyzer.analyzer_type === 'ftir' ? 'info' : 'success'}>
                            {ANALYZER_TYPE_LABELS[analyzer.analyzer_type]}
                        </Badge>
                    </div>
                    {analyzer.description && (
                        <p className="page-description">{analyzer.description}</p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/analyzers/${analyzer.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending || analyzer.is_in_use}
                        title={analyzer.is_in_use ? 'Cannot delete analyzer in use' : ''}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Type-Specific Parameters */}
            <div className="card">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    {isFTIRAnalyzer(analyzer) ? 'FTIR Parameters' : 'OES Parameters'}
                </h2>

                {isFTIRAnalyzer(analyzer) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Path Length
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.path_length ? `${analyzer.path_length} cm` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Resolution
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.resolution ? `${analyzer.resolution} cm⁻¹` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Interval
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.interval || 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Scans
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.scans || 'Not specified'}
                            </p>
                        </div>
                    </div>
                )}

                {isOESAnalyzer(analyzer) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Integration Time
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.integration_time ? `${analyzer.integration_time} ms` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Scans
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {analyzer.scans || 'Not specified'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Metadata
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Created
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(analyzer.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(analyzer.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Linked Experiments */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Experiments Using This Analyzer ({analyzer.experiments?.length || 0})
                </h2>
                {analyzer.experiments && analyzer.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {analyzer.experiments.map((experiment) => (
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
                                    <Badge variant="info">
                                        {EXPERIMENT_TYPE_LABELS[experiment.experiment_type as ExperimentType]}
                                    </Badge>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {experiment.purpose}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        This analyzer is not used in any experiments yet.
                    </p>
                )}
            </div>
        </div>
    );
};