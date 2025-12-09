/**
 * CharacterizationDetailPage - Detail view for a single characterization.
 *
 * Displays comprehensive characterization information including type-specific
 * details, linked files, and relationships to catalysts and samples.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCharacterization, useDeleteCharacterization } from '@/hooks/useCharacterizations';
import { Button, Badge } from '@/components/common';
import { CHARACTERIZATION_TYPE_LABELS } from '@/services/api';
import { format } from 'date-fns';

export const CharacterizationDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const characterizationId = id ? parseInt(id) : undefined;

    // Fetch characterization with all relationships
    const { data: char, isLoading, error } = useCharacterization(
        characterizationId,
        'performed_by,raw_data_file,processed_data_file,catalysts,samples'
    );

    const deleteMutation = useDeleteCharacterization();

    const handleDelete = () => {
        if (!char) return;
        if (window.confirm(`Are you sure you want to delete characterization "${char.name}"?`)) {
            deleteMutation.mutate(char.id, {
                onSuccess: () => navigate('/characterizations'),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading characterization...</p>
                </div>
            </div>
        );
    }

    if (error || !char) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Characterization not found or error loading data.</p>
                    <Link to="/characterizations">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Characterizations
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
                        <h1 className="page-title" style={{ margin: 0 }}>{char.name}</h1>
                        <Badge variant="info">{char.characterization_type}</Badge>
                    </div>
                    <p className="page-description">
                        {CHARACTERIZATION_TYPE_LABELS[char.characterization_type]} • Record #{char.id}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to="/characterizations">
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                    <Link to={`/characterizations/${char.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                        Delete
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {/* Basic Information */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Measurement Details
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Type
                            </dt>
                            <dd style={{ margin: 0, fontWeight: 500 }}>
                                {CHARACTERIZATION_TYPE_LABELS[char.characterization_type]}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Performed By
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.performed_by ? (
                                    <Link to={`/users/${char.performed_by.id}`} style={{ color: 'var(--color-primary)' }}>
                                        {char.performed_by.full_name || char.performed_by.username}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Not recorded</span>
                                )}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Date Performed
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.performed_at
                                    ? format(new Date(char.performed_at), 'MMMM d, yyyy')
                                    : <span style={{ color: 'var(--color-text-secondary)' }}>Not recorded</span>}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Equipment Used
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.equipment_used || <span style={{ color: 'var(--color-text-secondary)' }}>Not specified</span>}
                            </dd>
                        </div>
                        <div>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Conditions
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.conditions || <span style={{ color: 'var(--color-text-secondary)' }}>Not specified</span>}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Data Files */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Data Files
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Raw Data
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.raw_data_file ? (
                                    <Link
                                        to={`/files/${char.raw_data_file.id}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            color: 'var(--color-primary)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        📄 {char.raw_data_file.filename}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>No file attached</span>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Processed Data
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {char.processed_data_file ? (
                                    <Link
                                        to={`/files/${char.processed_data_file.id}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            color: 'var(--color-primary)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        📄 {char.processed_data_file.filename}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>No file attached</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Record Info */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Record Information
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Created At
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {format(new Date(char.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                            </dd>
                        </div>
                        <div>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Last Updated
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {format(new Date(char.updated_at), 'MMMM d, yyyy \'at\' h:mm a')}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Notes */}
            {char.notes && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Notes
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{char.notes}</p>
                </div>
            )}

            {/* Linked Catalysts */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Linked Catalysts ({char.catalysts?.length || 0})
                    </h2>
                </div>
                {char.catalysts && char.catalysts.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {char.catalysts.map((catalyst) => (
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
                        This characterization is not linked to any catalysts.
                    </p>
                )}
            </div>

            {/* Linked Samples */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Linked Samples ({char.samples?.length || 0})
                    </h2>
                </div>
                {char.samples && char.samples.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {char.samples.map((sample) => (
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
                        This characterization is not linked to any samples.
                    </p>
                )}
            </div>
        </div>
    );
};