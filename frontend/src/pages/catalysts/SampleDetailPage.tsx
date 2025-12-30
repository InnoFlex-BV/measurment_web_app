/**
 * SampleDetailPage - Comprehensive detail view for a single sample.
 *
 * Displays sample information including:
 * - Basic properties (name, amounts, storage)
 * - Source catalyst and method
 * - Linked characterizations (with add/remove management)
 * - Linked observations (with add/remove management)
 * - Associated users (with add/remove management)
 *
 * Uses the RelationshipManager component for consistent relationship UI.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useSample,
    useDeleteSample,
    useAddCharacterizationToSample,
    useRemoveCharacterizationFromSample,
    useAddObservationToSample,
    useRemoveObservationFromSample,
    useAddUserToSample,
    useRemoveUserFromSample,
} from '@/hooks/useSamples';
import { useCharacterizations } from '@/hooks/useCharacterizations';
import { useObservations } from '@/hooks/useObservations';
import { useUsers } from '@/hooks/useUsers';
import { Button, Badge, RelationshipManager } from '@/components/common';
import type {
    CharacterizationSimple,
    ObservationSimple,
    UserSimple,
    Characterization,
    Observation,
    User,
} from '@/services/api';

/**
 * Characterization type labels
 */
const CHAR_TYPE_LABELS: Record<string, string> = {
    XRD: 'XRD',
    BET: 'BET',
    TEM: 'TEM',
    SEM: 'SEM',
    FTIR: 'FTIR',
    XPS: 'XPS',
    TGA: 'TGA',
    OTHER: 'Other',
};

export const SampleDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const sampleId = id ? parseInt(id) : undefined;

    // Fetch sample with all relationships
    const { data: sample, isLoading, error } = useSample(
        sampleId,
        'catalyst,support,method,created_by,characterizations,observations,users'
    );

    // Fetch available items for relationship management
    const { data: allCharacterizations, isLoading: isLoadingChars } = useCharacterizations({});
    const { data: allObservations, isLoading: isLoadingObs } = useObservations({});
    const { data: allUsers, isLoading: isLoadingUsers } = useUsers({ is_active: true });

    // Mutations
    const deleteMutation = useDeleteSample();
    const addCharMutation = useAddCharacterizationToSample();
    const removeCharMutation = useRemoveCharacterizationFromSample();
    const addObsMutation = useAddObservationToSample();
    const removeObsMutation = useRemoveObservationFromSample();
    const addUserMutation = useAddUserToSample();
    const removeUserMutation = useRemoveUserFromSample();

    const handleDelete = () => {
        if (!sample) return;

        if (window.confirm(`Are you sure you want to delete sample "${sample.name}"?`)) {
            deleteMutation.mutate({ id: sample.id }, {
                onSuccess: () => navigate('/samples'),
            });
        }
    };

    // Loading and error states
    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading sample...</p>
                </div>
            </div>
        );
    }

    if (error || !sample) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Sample not found</h2>
                    <p>The sample you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/samples">
                        <Button variant="primary">Back to Samples</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate derived properties
    const usagePercentage = sample.yield_amount && parseFloat(sample.yield_amount) > 0
        ? ((parseFloat(sample.yield_amount) - parseFloat(sample.remaining_amount || '0')) /
        parseFloat(sample.yield_amount)) * 100
        : 0;

    const isDepleted = sample.is_depleted;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Link
                            to="/samples"
                            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            ← Back to Samples
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{sample.name}</h1>
                            {isDepleted && <Badge variant="danger">Depleted</Badge>}
                        </div>
                        <p className="page-description">
                            Created {new Date(sample.created_at).toLocaleDateString()}
                            {sample.created_by && ` by ${sample.created_by.full_name}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Link to={`/samples/${sample.id}/edit`}>
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Main Content Column */}
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                    {/* Basic Properties Card */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Sample Properties
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Yield Amount
                                </p>
                                <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                    {sample.yield_amount}g
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Remaining Amount
                                </p>
                                <p style={{
                                    fontWeight: 500,
                                    fontFamily: 'monospace',
                                    color: isDepleted ? 'var(--color-danger)' : 'inherit',
                                }}>
                                    {sample.remaining_amount}g
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Usage
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <div style={{
                                        flex: 1,
                                        height: '8px',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${usagePercentage}%`,
                                            height: '100%',
                                            backgroundColor: usagePercentage > 90
                                                ? 'var(--color-danger)'
                                                : usagePercentage > 50
                                                    ? 'var(--color-warning)'
                                                    : 'var(--color-success)',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                                        {usagePercentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Storage Location
                                </p>
                                <p style={{ fontWeight: 500 }}>
                                    {sample.storage_location || '—'}
                                </p>
                            </div>
                        </div>
                        {sample.notes && (
                            <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Notes
                                </p>
                                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                    {sample.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Source Information Card */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Source Information
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Source Catalyst
                                </p>
                                {sample.catalyst ? (
                                    <Link
                                        to={`/catalysts/${sample.catalyst.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {sample.catalyst.name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Support Material
                                </p>
                                {sample.support ? (
                                    <Link
                                        to={`/supports/${sample.support.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {sample.support.descriptive_name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Preparation Method
                                </p>
                                {sample.method ? (
                                    <Link
                                        to={`/methods/${sample.method.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {sample.method.descriptive_name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Created By
                                </p>
                                {sample.created_by ? (
                                    <Link
                                        to={`/users/${sample.created_by.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {sample.created_by.full_name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Characterizations Relationship Manager */}
                    <RelationshipManager<CharacterizationSimple | Characterization>
                        title="Characterizations"
                        linkedItems={sample.characterizations || []}
                        availableItems={allCharacterizations || []}
                        isLoadingAvailable={isLoadingChars}
                        getItemName={(item) => item.name}
                        getItemSecondary={(item) => ('equipment_used' in item && item.equipment_used) || 'No equipment specified'}
                        getItemBadge={(item) => ({
                            label: CHAR_TYPE_LABELS[item.characterization_type] || item.characterization_type,
                            variant: 'info',
                        })}
                        itemLinkPrefix="/characterizations"
                        onAdd={(characterizationId) =>
                            addCharMutation.mutate({ sampleId: sample.id, characterizationId })
                        }
                        onRemove={(characterizationId) =>
                            removeCharMutation.mutate({ sampleId: sample.id, characterizationId })
                        }
                        isPending={addCharMutation.isPending || removeCharMutation.isPending}
                        emptyMessage="No characterizations linked to this sample yet."
                    />

                    {/* Observations Relationship Manager */}
                    <RelationshipManager<ObservationSimple | Observation>
                        title="Observations"
                        linkedItems={sample.observations || []}
                        availableItems={allObservations || []}
                        isLoadingAvailable={isLoadingObs}
                        getItemName={(item) => ('objective' in item ? item.objective : (item as any).title) || `Observation #${item.id}`}
                        getItemSecondary={(item) => ('conclusions' in item && item.conclusions) ? item.conclusions.toString() : ''}
                        itemLinkPrefix="/observations"
                        onAdd={(observationId) =>
                            addObsMutation.mutate({ sampleId: sample.id, observationId })
                        }
                        onRemove={(observationId) =>
                            removeObsMutation.mutate({ sampleId: sample.id, observationId })
                        }
                        isPending={addObsMutation.isPending || removeObsMutation.isPending}
                        emptyMessage="No observations linked to this sample yet."
                    />
                </div>

                {/* Sidebar */}
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)', alignContent: 'start' }}>
                    {/* Quick Stats */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Quick Stats
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Characterizations</span>
                                <span style={{ fontWeight: 500 }}>{sample.characterizations?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Observations</span>
                                <span style={{ fontWeight: 500 }}>{sample.observations?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Contributors</span>
                                <span style={{ fontWeight: 500 }}>{sample.created_by?.full_name?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Users Relationship Manager */}
                    <RelationshipManager<UserSimple | User>
                        title="Contributors"
                        linkedItems={sample.created_by ? [sample.created_by] : []}
                        availableItems={allUsers || []}
                        isLoadingAvailable={isLoadingUsers}
                        getItemName={(item) => item.full_name}
                        getItemSecondary={(item) => ('email' in item ? item.email : item.username)}
                        getItemBadge={(item) => ('is_active' in item && !item.is_active) ? { label: 'Inactive', variant: 'neutral' } : null}
                        itemLinkPrefix="/users"
                        onAdd={(userId) =>
                            addUserMutation.mutate({ sampleId: sample.id, userId })
                        }
                        onRemove={(userId) =>
                            removeUserMutation.mutate({ sampleId: sample.id, userId })
                        }
                        isPending={addUserMutation.isPending || removeUserMutation.isPending}
                        emptyMessage="No contributors linked yet."
                    />

                    {/* Timestamps */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Timestamps
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Created</p>
                                <p>{new Date(sample.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Updated</p>
                                <p>{new Date(sample.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            <Link to={`/characterizations/new`}>
                                <Button variant="secondary" style={{ width: '100%' }}>
                                    + Add Characterization
                                </Button>
                            </Link>
                            <Link to={`/observations/new`}>
                                <Button variant="secondary" style={{ width: '100%' }}>
                                    + Add Observation
                                </Button>
                            </Link>
                            {sample.catalyst && (
                                <Link to={`/catalysts/${sample.catalyst.id}`}>
                                    <Button variant="secondary" style={{ width: '100%' }}>
                                        View Source Catalyst
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
