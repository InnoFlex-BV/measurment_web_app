/**
 * MethodDetailPage - Detail view for a single synthesis method.
 *
 * This page demonstrates how to display relationships that were managed in the
 * form. We use the include parameter to fetch the method with its associated
 * chemicals, then display those chemicals as a list. This shows users which
 * chemicals this method requires without them having to navigate away or
 * remember IDs.
 *
 * The pattern of using include to load related data and then displaying it
 * in the detail view is fundamental. Every entity with relationships will
 * follow this pattern, with variations in how the related data is displayed.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMethod, useDeleteMethod } from '@/hooks/useMethods';
import { Button } from '@/components/common';

export const MethodDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const methodId = id ? parseInt(id) : undefined;

    // Fetch method with chemicals included
    // The 'chemicals' parameter tells the API to populate the chemicals relationship
    const { data: method, isLoading, error } = useMethod(methodId, 'chemicals');
    const deleteMutation = useDeleteMethod();

    const handleDelete = () => {
        if (!method) return;

        if (window.confirm(`Are you sure you want to delete method "${method.descriptive_name}"?`)) {
            deleteMutation.mutate(method.id, {
                onSuccess: () => {
                    navigate('/methods');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading method...</p>
                </div>
            </div>
        );
    }

    if (error || !method) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Method not found or error loading data.</p>
                    <Link to="/methods">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Methods
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
                    <h1 className="page-title">{method.descriptive_name}</h1>
                    <p className="page-description">
            <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: method.is_active ? 'var(--color-success)' : 'var(--color-secondary)',
                color: 'white'
            }}>
              {method.is_active ? 'Active' : 'Inactive'}
            </span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/methods/${method.id}/edit`}>
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

            {/* Basic details card */}
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label className="form-label">Created</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(method.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Last Updated</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(method.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
                    <label className="form-label">Procedure</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {method.procedure}
                    </p>
                </div>
            </div>

            {/* Chemicals section - this is where we display the relationship */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Chemicals Used
                </h3>

                {method.chemicals && method.chemicals.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {method.chemicals.map(chemical => (
                            <Link
                                key={chemical.id}
                                to={`/chemicals/${chemical.id}`}
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
                                {chemical.name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        No chemicals specified for this method.
                    </p>
                )}
            </div>

            {/* TODO: Add section showing catalysts created using this method */}
        </div>
    );
};