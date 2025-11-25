/**
 * ChemicalDetailPage - Detail view for a single chemical.
 *
 * With only basic attributes to display, this page is straightforward. However,
 * when you implement methods in Phase One and samples in Phase Two, this page
 * will grow to show relationships like "Methods that use this chemical" and
 * "Samples that contain this chemical." The component structure accommodates
 * this growth naturally by adding new sections below the basic details.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useChemical, useDeleteChemical } from '@/hooks/useChemicals';
import { Button } from '@/components/common';

export const ChemicalDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const chemicalId = id ? parseInt(id) : undefined;

    const { data: chemical, isLoading, error } = useChemical(chemicalId, 'methods');
    const deleteMutation = useDeleteChemical();

    const handleDelete = () => {
        if (!chemical) return;

        if (window.confirm(`Are you sure you want to delete chemical "${chemical.name}"?`)) {
            deleteMutation.mutate(chemical.id, {
                onSuccess: () => {
                    navigate('/chemicals');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading chemical...</p>
                </div>
            </div>
        );
    }

    if (error || !chemical) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Chemical not found or error loading data.</p>
                    <Link to="/chemicals">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Chemicals
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">{chemical.name}</h1>
                    <p className="page-description">Chemical Compound</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/chemicals/${chemical.id}/edit`}>
                        <Button variant="primary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        isLoading={deleteMutation.isPending}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label className="form-label">Chemical Name</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{chemical.name}</p>
                    </div>

                    <div>
                        <label className="form-label">Created</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(chemical.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Last Updated</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(chemical.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chemicals section - this is where we display the relationship */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Used In Methods
                </h3>

                {chemical.methods && chemical.methods.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {chemical.methods.map(method => (
                            <Link
                                key={method.id}
                                to={`/methods/${method.id}`}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: 'var(--color-text)',
                                    fontSize: '0.875rem',
                                    border: '1px solid var(--color-border)',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                    e.currentTarget.style.color = 'var(--color-text)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                }}
                            >
                                {method.descriptive_name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        No methods use this chemical.
                    </p>
                )}
            </div>
            {/* TODO: Phase 2 - Add section showing samples containing this chemical */}
        </div>
    );
};