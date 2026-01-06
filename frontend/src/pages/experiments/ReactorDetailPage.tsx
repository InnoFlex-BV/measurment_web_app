/**
 * ReactorDetailPage - Detail view for a single reactor.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useReactor, useDeleteReactor } from '@/hooks/useReactors';
import { Button, Badge } from '@/components/common';
import { EXPERIMENT_TYPE_LABELS, type ExperimentType } from '@/services/api';
import { format } from 'date-fns';

export const ReactorDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const reactorId = id ? parseInt(id) : undefined;

    const { data: reactor, isLoading, error } = useReactor(reactorId, 'experiments');
    const deleteMutation = useDeleteReactor();

    const handleDelete = () => {
        if (!reactor) return;

        if (window.confirm(`Are you sure you want to delete this reactor?`)) {
            deleteMutation.mutate({ id: reactor.id }, {
                onSuccess: () => {
                    navigate('/reactors');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading reactor...</p>
                </div>
            </div>
        );
    }

    if (error || !reactor) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Reactor not found or error loading data.</p>
                    <Link to="/reactors">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Reactors
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
                        to="/reactors"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Reactors
                    </Link>
                    <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                        {reactor.name}
                    </h1>
                    <p className="page-description">Reactor vessel for experiments</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/reactors/${reactor.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending || reactor.is_in_use}
                        title={reactor.is_in_use ? 'Cannot delete reactor in use' : ''}
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
                            Name
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {reactor.name}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Volume
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {reactor.volume
                                ? `${parseFloat(reactor.volume).toFixed(4)} mL`
                                : 'Not specified'}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Status
                        </p>
                        <Badge variant={reactor.is_in_use ? 'success' : 'neutral'}>
                            {reactor.is_in_use ? 'In Use' : 'Available'}
                        </Badge>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Created
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(reactor.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(reactor.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Description */}
            {reactor.description && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Description
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reactor.description}</p>
                </div>
            )}

            {/* Linked Experiments */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Experiments Using This Reactor ({reactor.experiments?.length || 0})
                </h2>
                {reactor.experiments && reactor.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {reactor.experiments.map((experiment) => (
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
                        This reactor is not used in any experiments yet.
                    </p>
                )}
            </div>
        </div>
    );
};