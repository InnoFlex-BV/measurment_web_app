/**
 * ContaminantDetailPage - Detail view for a single contaminant.
 *
 * Shows contaminant details and linked experiments with their ppm values.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useContaminant, useDeleteContaminant } from '@/hooks/useContaminants.ts';
import { Button } from '@/components/common';
import { format } from 'date-fns';

export const ContaminantDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const contaminantId = id ? parseInt(id) : undefined;

    const { data: contaminant, isLoading, error } = useContaminant(contaminantId, 'experiments');
    const deleteMutation = useDeleteContaminant();

    const handleDelete = () => {
        if (!contaminant) return;

        if (window.confirm(`Are you sure you want to delete contaminant "${contaminant.name}"?`)) {
            deleteMutation.mutate({ id: contaminant.id }, {
                onSuccess: () => {
                    navigate('/contaminants');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading contaminant...</p>
                </div>
            </div>
        );
    }

    if (error || !contaminant) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Contaminant not found or error loading data.</p>
                    <Link to="/contaminants">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Contaminants
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
                        to="/contaminants"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Contaminants
                    </Link>
                    <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                        {contaminant.name}
                    </h1>
                    <p className="page-description">Target compound for decomposition</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/contaminants/${contaminant.id}/edit`}>
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

            {/* Basic Info */}
            <div className="card">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Created
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(contaminant.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(contaminant.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Linked Experiments */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Experiments Using This Contaminant ({contaminant.experiments?.length || 0})
                </h2>
                {contaminant.experiments && contaminant.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {contaminant.experiments.map((experiment) => (
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
                                <div>
                                    <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                        {experiment.name}
                                    </span>
                                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        ({experiment.experiment_type})
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {experiment.purpose}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        This contaminant is not used in any experiments yet.
                    </p>
                )}
            </div>
        </div>
    );
};
