/**
 * ExperimentDetailPage - Comprehensive detail view for a single experiment.
 *
 * Displays all experiment information including:
 * - Basic properties and type-specific fields
 * - Equipment (reactor, analyzer, waveform)
 * - Linked samples (with add/remove management)
 * - Linked groups (with add/remove management)
 * - Associated users (with add/remove management)
 * - Contaminants with PPM values
 * - Carriers with ratio values
 * - Processed results
 *
 * Supports polymorphic experiment types: Plasma, Photocatalysis, Misc
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useExperiment,
    useDeleteExperiment,
    useAddSampleToExperiment,
    useRemoveSampleFromExperiment,
    useAddGroupToExperiment,
    useRemoveGroupFromExperiment,
    useAddUserToExperiment,
    useRemoveUserFromExperiment,
} from '@/hooks/useExperiments';
import { useSamples } from '@/hooks/useSamples';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';
import { Button, Badge, RelationshipManager } from '@/components/common';
import type {
    SampleSimple,
    GroupSimple,
    UserSimple,
    Sample,
    Group,
    User,
    ExperimentType,
} from '@/services/api';

/**
 * Experiment type display configuration
 */
const EXPERIMENT_TYPE_CONFIG: Record<ExperimentType, { label: string; variant: 'info' | 'success' | 'warning' }> = {
    plasma: { label: 'Plasma', variant: 'info' },
    photocatalysis: { label: 'Photocatalysis', variant: 'success' },
    misc: { label: 'Miscellaneous', variant: 'warning' },
};

export const ExperimentDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const experimentId = id ? parseInt(id) : undefined;

    // Fetch experiment with all relationships
    const { data: experiment, isLoading, error } = useExperiment(
        experimentId,
        'reactor,analyzer,samples,contaminants,carriers,groups,users,raw_data_file,processed_results'
    );

    // Fetch available items for relationship management
    const { data: allSamples, isLoading: isLoadingSamples } = useSamples({});
    const { data: allGroups, isLoading: isLoadingGroups } = useGroups({});
    const { data: allUsers, isLoading: isLoadingUsers } = useUsers({ is_active: true });

    // Mutations
    const deleteMutation = useDeleteExperiment();
    const addSampleMutation = useAddSampleToExperiment();
    const removeSampleMutation = useRemoveSampleFromExperiment();
    const addGroupMutation = useAddGroupToExperiment();
    const removeGroupMutation = useRemoveGroupFromExperiment();
    const addUserMutation = useAddUserToExperiment();
    const removeUserMutation = useRemoveUserFromExperiment();

    const handleDelete = () => {
        if (!experiment) return;

        if (window.confirm(`Are you sure you want to delete experiment "${experiment.name}"?`)) {
            deleteMutation.mutate(experiment.id, {
                onSuccess: () => navigate('/experiments'),
            });
        }
    };

    // Loading and error states
    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading experiment...</p>
                </div>
            </div>
        );
    }

    if (error || !experiment) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Experiment not found</h2>
                    <p>The experiment you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/experiments">
                        <Button variant="primary">Back to Experiments</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const typeConfig = EXPERIMENT_TYPE_CONFIG[experiment.experiment_type as ExperimentType];

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Link
                            to="/experiments"
                            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            ← Back to Experiments
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{experiment.name}</h1>
                            <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                        </div>
                        <p className="page-description">{experiment.purpose}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Link to={`/experiments/${experiment.id}/edit`}>
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
                            Experiment Details
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Reactor
                                </p>
                                {experiment.reactor ? (
                                    <Link
                                        to={`/reactors/${experiment.reactor.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {experiment.reactor.name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Analyzer
                                </p>
                                {experiment.analyzer ? (
                                    <Link
                                        to={`/analyzers/${experiment.analyzer.id}`}
                                        style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        {experiment.analyzer.name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                )}
                            </div>
                        </div>

                        {/* Type-specific fields */}
                        {experiment.experiment_type === 'plasma' && (
                            <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    Plasma Parameters
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Power</p>
                                        <p style={{ fontFamily: 'monospace' }}>
                                            {(experiment as any).power ? `${(experiment as any).power}W` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Frequency</p>
                                        <p style={{ fontFamily: 'monospace' }}>
                                            {(experiment as any).frequency ? `${(experiment as any).frequency}Hz` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Flow Rate</p>
                                        <p style={{ fontFamily: 'monospace' }}>
                                            {(experiment as any).flow_rate ? `${(experiment as any).flow_rate} mL/min` : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {experiment.experiment_type === 'photocatalysis' && (
                            <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    Photocatalysis Parameters
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Light Source</p>
                                        <p>{(experiment as any).light_source || '—'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Wavelength</p>
                                        <p style={{ fontFamily: 'monospace' }}>
                                            {(experiment as any).wavelength ? `${(experiment as any).wavelength}nm` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Intensity</p>
                                        <p style={{ fontFamily: 'monospace' }}>
                                            {(experiment as any).intensity ? `${(experiment as any).intensity} mW/cm²` : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {experiment.notes && (
                            <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Notes
                                </p>
                                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                    {experiment.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contaminants Card */}
                    {experiment.contaminants && experiment.contaminants.length > 0 && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                                Contaminants ({experiment.contaminants.length})
                            </h2>
                            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
                                {experiment.contaminants.map((cont: any) => (
                                    <div
                                        key={cont.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{cont.name}</span>
                                            {cont.formula && (
                                                <span style={{
                                                    marginLeft: 'var(--spacing-sm)',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-secondary)',
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {cont.formula}
                                                </span>
                                            )}
                                        </div>
                                        {cont.ppm !== null && cont.ppm !== undefined && (
                                            <Badge variant="info">{cont.ppm} ppm</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Carriers Card */}
                    {experiment.carriers && experiment.carriers.length > 0 && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                                Carriers ({experiment.carriers.length})
                            </h2>
                            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
                                {experiment.carriers.map((carrier: any) => (
                                    <div
                                        key={carrier.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--border-radius)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{carrier.name}</span>
                                            {carrier.formula && (
                                                <span style={{
                                                    marginLeft: 'var(--spacing-sm)',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-secondary)',
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {carrier.formula}
                                                </span>
                                            )}
                                        </div>
                                        {carrier.ratio !== null && carrier.ratio !== undefined && (
                                            <Badge variant="neutral">{(carrier.ratio * 100).toFixed(1)}%</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Processed Results Card */}
                    {experiment.processed_results && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                                Processed Results
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        DRE (Decomposition/Removal Efficiency)
                                    </p>
                                    <p style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        color: experiment.processed_results.dre && parseFloat(experiment.processed_results.dre) >= 80
                                            ? 'var(--color-success)'
                                            : 'inherit',
                                    }}>
                                        {experiment.processed_results.dre
                                            ? `${parseFloat(experiment.processed_results.dre).toFixed(2)}%`
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        EY (Energy Yield)
                                    </p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                        {experiment.processed_results.ey
                                            ? `${parseFloat(experiment.processed_results.ey).toFixed(2)} g/kWh`
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                            <Link
                                to={`/processed/${experiment.processed_results.id}`}
                                style={{
                                    display: 'inline-block',
                                    marginTop: 'var(--spacing-md)',
                                    color: 'var(--color-primary)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                View full results →
                            </Link>
                        </div>
                    )}

                    {/* Samples Relationship Manager */}
                    <RelationshipManager<SampleSimple | Sample>
                        title="Samples"
                        linkedItems={experiment.samples || []}
                        availableItems={allSamples || []}
                        isLoadingAvailable={isLoadingSamples}
                        getItemName={(item) => item.name}
                        getItemSecondary={(item) => `${item.remaining_amount}g remaining`}
                        getItemBadge={(item) => ('is_depleted' in item && item.is_depleted) ? { label: 'Depleted', variant: 'danger' } : null}
                        itemLinkPrefix="/samples"
                        onAdd={(sampleId) =>
                            addSampleMutation.mutate({ experimentId: experiment.id, sampleId })
                        }
                        onRemove={(sampleId) =>
                            removeSampleMutation.mutate({ experimentId: experiment.id, sampleId })
                        }
                        isPending={addSampleMutation.isPending || removeSampleMutation.isPending}
                        emptyMessage="No samples linked to this experiment yet."
                    />

                    {/* Groups Relationship Manager */}
                    <RelationshipManager<GroupSimple | Group>
                        title="Groups"
                        linkedItems={experiment.groups || []}
                        availableItems={allGroups || []}
                        isLoadingAvailable={isLoadingGroups}
                        getItemName={(item) => item.name}
                        getItemSecondary={(item) => item.purpose || ''}
                        itemLinkPrefix="/groups"
                        onAdd={(groupId) =>
                            addGroupMutation.mutate({ experimentId: experiment.id, groupId })
                        }
                        onRemove={(groupId) =>
                            removeGroupMutation.mutate({ experimentId: experiment.id, groupId })
                        }
                        isPending={addGroupMutation.isPending || removeGroupMutation.isPending}
                        emptyMessage="Not part of any experiment groups yet."
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
                                <span style={{ fontWeight: 500 }}>{experiment.samples?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Contaminants</span>
                                <span style={{ fontWeight: 500 }}>{experiment.contaminants?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Carriers</span>
                                <span style={{ fontWeight: 500 }}>{experiment.carriers?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Groups</span>
                                <span style={{ fontWeight: 500 }}>{experiment.groups?.length || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Has Results</span>
                                <span style={{ fontWeight: 500 }}>
                                    {experiment.processed_results ? '✓' : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Users Relationship Manager */}
                    <RelationshipManager<UserSimple | User>
                        title="Team Members"
                        linkedItems={experiment.users || []}
                        availableItems={allUsers || []}
                        isLoadingAvailable={isLoadingUsers}
                        getItemName={(item) => item.full_name}
                        getItemSecondary={(item) => ('email' in item ? item.email : item.username)}
                        getItemBadge={(item) => ('is_active' in item && !item.is_active) ? { label: 'Inactive', variant: 'neutral' } : null}
                        itemLinkPrefix="/users"
                        onAdd={(userId) =>
                            addUserMutation.mutate({ experimentId: experiment.id, userId })
                        }
                        onRemove={(userId) =>
                            removeUserMutation.mutate({ experimentId: experiment.id, userId })
                        }
                        isPending={addUserMutation.isPending || removeUserMutation.isPending}
                        emptyMessage="No team members assigned yet."
                    />

                    {/* Timestamps */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Timestamps
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Created</p>
                                <p>{new Date(experiment.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Updated</p>
                                <p>{new Date(experiment.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            {!experiment.processed_results && (
                                <Link to={`/processed/new`}>
                                    <Button variant="primary" style={{ width: '100%' }}>
                                        + Add Results
                                    </Button>
                                </Link>
                            )}
                            <Link to={`/experiments/new?clone=${experiment.id}`}>
                                <Button variant="secondary" style={{ width: '100%' }}>
                                    Clone Experiment
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
