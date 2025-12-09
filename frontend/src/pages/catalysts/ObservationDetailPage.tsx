/**
 * ObservationDetailPage - Detail view for a single observation.
 *
 * Displays the full observation content along with metadata, linked files,
 * and relationships to catalysts and samples.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useObservation, useDeleteObservation } from '@/hooks/useObservations';
import { Button, Badge } from '@/components/common';
import { format } from 'date-fns';

export const ObservationDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const observationId = id ? parseInt(id) : undefined;

    // Fetch observation with all relationships
    const { data: obs, isLoading, error } = useObservation(
        observationId,
        'observed_by,files,catalysts,samples'
    );

    const deleteMutation = useDeleteObservation();

    const handleDelete = () => {
        if (!obs) return;
        if (window.confirm(`Are you sure you want to delete observation "${obs.title}"?`)) {
            deleteMutation.mutate(obs.id, {
                onSuccess: () => navigate('/observations'),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading observation...</p>
                </div>
            </div>
        );
    }

    if (error || !obs) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Observation not found or error loading data.</p>
                    <Link to="/observations">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Observations
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>{obs.title}</h1>
                        {obs.observation_type && (
                            <Badge variant="neutral">{obs.observation_type}</Badge>
                        )}
                    </div>
                    <p className="page-description">Observation #{obs.id}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to="/observations">
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                    <Link to={`/observations/${obs.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                        Delete
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Main Content */}
                <div>
                    {/* Observation Content */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Content
                        </h2>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {obs.content}
                        </div>
                    </div>

                    {/* Linked Catalysts */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                Linked Catalysts ({obs.catalysts?.length || 0})
                            </h2>
                        </div>
                        {obs.catalysts && obs.catalysts.length > 0 ? (
                            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                {obs.catalysts.map((catalyst) => (
                                    <Link
                                        key={catalyst.id}
                                        to={`/catalysts/${catalyst.id}`}
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
                                        <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                            {catalyst.name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {catalyst.storage_location}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                This observation is not linked to any catalysts.
                            </p>
                        )}
                    </div>

                    {/* Linked Samples */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                Linked Samples ({obs.samples?.length || 0})
                            </h2>
                        </div>
                        {obs.samples && obs.samples.length > 0 ? (
                            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                {obs.samples.map((sample) => (
                                    <Link
                                        key={sample.id}
                                        to={`/samples/${sample.id}`}
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
                                        <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                            {sample.name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {sample.storage_location}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                This observation is not linked to any samples.
                            </p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    {/* Metadata */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Details
                        </h2>
                        <dl style={{ margin: 0 }}>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Observed By
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {obs.observed_by ? (
                                        <Link to={`/users/${obs.observed_by.id}`} style={{ color: 'var(--color-primary)' }}>
                                            {obs.observed_by.full_name || obs.observed_by.username}
                                        </Link>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Not recorded</span>
                                    )}
                                </dd>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Date Observed
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {obs.observed_at
                                        ? format(new Date(obs.observed_at), 'MMMM d, yyyy')
                                        : <span style={{ color: 'var(--color-text-secondary)' }}>Not recorded</span>}
                                </dd>
                            </div>
                            {obs.observation_type && (
                                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                    <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Type
                                    </dt>
                                    <dd style={{ margin: 0 }}>{obs.observation_type}</dd>
                                </div>
                            )}
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Created
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {format(new Date(obs.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                                </dd>
                            </div>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Last Updated
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {format(new Date(obs.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Attached Files */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Attached Files ({obs.files?.length || 0})
                        </h2>
                        {obs.files && obs.files.length > 0 ? (
                            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
                                {obs.files.map((file) => (
                                    <Link
                                        key={file.id}
                                        to={`/files/${file.id}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            textDecoration: 'none',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        📄 {file.filename}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                                No files attached to this observation.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};