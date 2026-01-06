/**
 * CatalystDetailPage - Comprehensive detail view for a single catalyst.
 *
 * This page displays all catalyst information including:
 * - Basic properties (name, amounts, storage)
 * - Synthesis information (method, input catalysts)
 * - Derived catalysts (output catalysts)
 * - Linked characterizations (with add/remove management)
 * - Linked observations (with add/remove management)
 * - Associated users (with add/remove management)
 * - Related samples
 *
 * Uses the RelationshipManager component for consistent relationship UI.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useCatalyst,
    useDeleteCatalyst,
    useAddCharacterizationToCatalyst,
    useRemoveCharacterizationFromCatalyst,
    useAddObservationToCatalyst,
    useRemoveObservationFromCatalyst,
    useAddUserToCatalyst,
    useRemoveUserFromCatalyst,
} from '@/hooks/useCatalysts';
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
 * Characterization type labels and badge variants
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

export const CatalystDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const catalystId = id ? parseInt(id) : undefined;

    // Fetch catalyst with all relationships
    const { data: catalyst, isLoading, error } = useCatalyst(
        catalystId,
        'method,input_catalysts,output_catalysts,samples,characterizations,observations,users'
    );

    // Fetch available items for relationship management
    const { data: allCharacterizations, isLoading: isLoadingChars } = useCharacterizations({});
    const { data: allObservations, isLoading: isLoadingObs } = useObservations({});
    const { data: allUsers, isLoading: isLoadingUsers } = useUsers({ is_active: true });

    // Mutations for relationship management
    const deleteMutation = useDeleteCatalyst();
    const addCharMutation = useAddCharacterizationToCatalyst();
    const removeCharMutation = useRemoveCharacterizationFromCatalyst();
    const addObsMutation = useAddObservationToCatalyst();
    const removeObsMutation = useRemoveObservationFromCatalyst();
    const addUserMutation = useAddUserToCatalyst();
    const removeUserMutation = useRemoveUserFromCatalyst();

    const handleDelete = () => {
        if (!catalyst) return;

        if (window.confirm(`Are you sure you want to delete catalyst "${catalyst.name}"?`)) {
            deleteMutation.mutate(catalyst.id, {
                onSuccess: () => navigate('/catalysts'),
            });
        }
    };

    // Loading and error states
    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading catalyst...</p>
                </div>
            </div>
        );
    }

    if (error || !catalyst) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Catalyst not found</h2>
                    <p>The catalyst you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/catalysts">
                        <Button variant="primary">Back to Catalysts</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate derived properties
    const usagePercentage = catalyst.yield_amount && parseFloat(catalyst.yield_amount) > 0
        ? ((parseFloat(catalyst.yield_amount) - parseFloat(catalyst.remaining_amount || '0')) /
        parseFloat(catalyst.yield_amount)) * 100
        : 0;

    const isDepleted = catalyst.is_depleted;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Link
                            to="/catalysts"
                            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            ← Back to Catalysts
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{catalyst.name}</h1>
                            {isDepleted && <Badge variant="danger">Depleted</Badge>}
                        </div>
                        <p className="page-description">
                            Created {new Date(catalyst.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Link to={`/catalysts/${catalyst.id}/edit`}>
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
                            Basic Properties
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Yield Amount
                                </p>
                                <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                    {catalyst.yield_amount}g
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
                                    {catalyst.remaining_amount}g
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
                                    {catalyst.storage_location || '—'}
                                </p>
                            </div>
                        </div>
                        {catalyst.notes && (
                            <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Notes
                                </p>
                                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                    {catalyst.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Synthesis Information Card */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Synthesis Information
                        </h2>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Method
                            </p>
                            {catalyst.method ? (
                                <Link
                                    to={`/methods/${catalyst.method.id}`}
                                    style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                >
                                    {catalyst.method.descriptive_name}
                                </Link>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)' }}>No method specified</p>
                            )}
                        </div>

                        {/* Input Catalysts */}
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Input Catalysts ({catalyst.input_catalysts?.length || 0})
                            </p>
                            {catalyst.input_catalysts && catalyst.input_catalysts.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                    {catalyst.input_catalysts.map(inputCat => (
                                        <Link
                                            key={inputCat.id}
                                            to={`/catalysts/${inputCat.id}`}
                                            style={{
                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--border-radius)',
                                                textDecoration: 'none',
                                                color: 'var(--color-text)',
                                                fontSize: '0.875rem',
                                                border: '1px solid var(--color-border)',
                                            }}
                                        >
                                            {inputCat.name}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    No input catalysts (original synthesis)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Output Catalysts Card */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Derived Catalysts ({catalyst.output_catalysts?.length || 0})
                        </h2>
                        {catalyst.output_catalysts && catalyst.output_catalysts.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-sm)' }}>
                                {catalyst.output_catalysts.map(outputCat => (
                                    <Link
                                        key={outputCat.id}
                                        to={`/catalysts/${outputCat.id}`}
                                        style={{
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            textDecoration: 'none',
                                            color: 'var(--color-text)',
                                            fontSize: '0.875rem',
                                            border: '1px solid var(--color-border)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {outputCat.name}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                No catalysts have been derived from this one yet.
                            </p>
                        )}
                    </div>

                    {/* Samples Card */}
                    {catalyst.samples && catalyst.samples.length > 0 && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                    Samples ({catalyst.samples.length})
                                </h2>
                                <Link to={`/samples/new?catalyst_id=${catalyst.id}`}>
                                    <Button variant="primary" size="sm">+ New Sample</Button>
                                </Link>
                            </div>
                            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
                                {catalyst.samples.map(sample => (
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
                                            color: 'var(--color-text)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{sample.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                            {sample.remaining_amount}g remaining
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Characterizations Relationship Manager */}
                    <RelationshipManager<CharacterizationSimple | Characterization>
                        title="Characterizations"
                        linkedItems={catalyst.characterizations || []}
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
                            addCharMutation.mutate({ catalystId: catalyst.id, characterizationId })
                        }
                        onRemove={(characterizationId) =>
                            removeCharMutation.mutate({ catalystId: catalyst.id, characterizationId })
                        }
                        isPending={addCharMutation.isPending || removeCharMutation.isPending}
                        emptyMessage="No characterizations linked to this catalyst yet."
                    />

                    {/* Observations Relationship Manager */}
                    <RelationshipManager<ObservationSimple | Observation>
                        title="Observations"
                        linkedItems={catalyst.observations || []}
                        availableItems={allObservations || []}
                        isLoadingAvailable={isLoadingObs}
                        getItemName={(item) =>
                            ('objective' in item ? item.objective : (item as any).title) || `Observation #${item.id}`}
                        getItemSecondary={(item) =>
                            ('conclusions' in item && item.conclusions) ? item.conclusions.toString().substring(0, 100) : ''}
                        itemLinkPrefix="/observations"
                        onAdd={(observationId) =>
                            addObsMutation.mutate({ catalystId: catalyst.id, observationId })
                        }
                        onRemove={(observationId) =>
                            removeObsMutation.mutate({ catalystId: catalyst.id, observationId })
                        }
                        isPending={addObsMutation.isPending || removeObsMutation.isPending}
                        emptyMessage="No observations linked to this catalyst yet."
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
                                <span style={{ color: 'var(--color-text-secondary)' }}>Samples</span>
                                <span style={{ fontWeight: 500 }}>{catalyst.samples?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Characterizations</span>
                                <span style={{ fontWeight: 500 }}>{catalyst.characterizations?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Observations</span>
                                <span style={{ fontWeight: 500 }}>{catalyst.observations?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Derived From</span>
                                <span style={{ fontWeight: 500 }}>{catalyst.input_catalysts?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Derivatives</span>
                                <span style={{ fontWeight: 500 }}>{catalyst.output_catalysts?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Users Relationship Manager */}
                    <RelationshipManager<UserSimple | User>
                        title="Contributors"
                        linkedItems={catalyst.users || []}
                        availableItems={allUsers || []}
                        isLoadingAvailable={isLoadingUsers}
                        getItemName={(item) => item.full_name}
                        getItemSecondary={(item) => ('email' in item ? item.email : item.username)}
                        getItemBadge={(item) => ('is_active' in item && !item.is_active) ? { label: 'Inactive', variant: 'neutral' } : null}
                        itemLinkPrefix="/users"
                        onAdd={(userId) =>
                            addUserMutation.mutate({ catalystId: catalyst.id, userId })
                        }
                        onRemove={(userId) =>
                            removeUserMutation.mutate({ catalystId: catalyst.id, userId })
                        }
                        isPending={addUserMutation.isPending || removeUserMutation.isPending}
                        emptyMessage="No users linked to this catalyst yet."
                    />

                    {/* Timestamps */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Timestamps
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Created</p>
                                <p>{new Date(catalyst.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Updated</p>
                                <p>{new Date(catalyst.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            <Link to={`/samples/new?catalyst_id=${catalyst.id}`}>
                                <Button variant="secondary" style={{ width: '100%' }}>
                                    + Create Sample
                                </Button>
                            </Link>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
