/**
 * CarrierDetailPage - Detail view for a single carrier gas.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCarrier, useDeleteCarrier } from '@/hooks/useCarriers.ts';
import { Button } from '@/components/common';
import { format } from 'date-fns';

export const CarrierDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const carrierId = id ? parseInt(id) : undefined;

    const { data: carrier, isLoading, error } = useCarrier(carrierId, 'experiments');
    const deleteMutation = useDeleteCarrier();

    const handleDelete = () => {
        if (!carrier) return;

        if (window.confirm(`Are you sure you want to delete carrier "${carrier.name}"?`)) {
            deleteMutation.mutate({ id: carrier.id }, {
                onSuccess: () => {
                    navigate('/carriers');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading carrier...</p>
                </div>
            </div>
        );
    }

    if (error || !carrier) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Carrier not found or error loading data.</p>
                    <Link to="/carriers">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Carriers
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
                        to="/carriers"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Carriers
                    </Link>
                    <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                        {carrier.name}
                    </h1>
                    <p className="page-description">Carrier gas for experiments</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/carriers/${carrier.id}/edit`}>
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
                            {format(new Date(carrier.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(carrier.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Linked Experiments */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Experiments Using This Carrier ({carrier.experiments?.length || 0})
                </h2>
                {carrier.experiments && carrier.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {carrier.experiments.map((experiment) => (
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
                        This carrier is not used in any experiments yet.
                    </p>
                )}
            </div>
        </div>
    );
};