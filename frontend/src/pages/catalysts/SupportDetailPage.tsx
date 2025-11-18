/**
 * SupportDetailPage - Detail view for a single support.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSupport, useDeleteSupport } from '@/hooks/useSupports';
import { Button } from '@/components/common';

export const SupportDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const supportId = id ? parseInt(id) : undefined;

    const { data: support, isLoading, error } = useSupport(supportId);
    const deleteMutation = useDeleteSupport();

    const handleDelete = () => {
        if (!support) return;

        if (window.confirm(`Are you sure you want to delete support "${support.descriptive_name}"?`)) {
            deleteMutation.mutate(support.id, {
                onSuccess: () => {
                    navigate('/supports');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading support...</p>
                </div>
            </div>
        );
    }

    if (error || !support) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Support not found or error loading data.</p>
                    <Link to="/supports">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Supports
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
                    <h1 className="page-title">{support.descriptive_name}</h1>
                    <p className="page-description">Support Material</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/supports/${support.id}/edit`}>
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
                        <label className="form-label">Support Name</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{support.descriptive_name}</p>
                    </div>

                    <div>
                        <label className="form-label">Created</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(support.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Last Updated</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(support.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {support.description && (
                    <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
                        <label className="form-label">Description</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                            {support.description}
                        </p>
                    </div>
                )}
            </div>

            {/* TODO: Phase 2 - Add section showing samples that use this support */}
        </div>
    );
};