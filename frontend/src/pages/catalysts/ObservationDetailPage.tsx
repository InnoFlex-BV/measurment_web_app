/**
 * ObservationDetailPage - Detail view for a single observation.
 *
 * Displays the full observation content including conditions, calcination parameters,
 * collected data, and conclusions. Also shows relationships to catalysts, samples,
 * files, and users with add/remove management capabilities.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useObservation,
    useDeleteObservation,
    useAddFileToObservation,
    useRemoveFileFromObservation,
    useAddCatalystToObservation,
    useRemoveCatalystFromObservation,
    useAddSampleToObservation,
    useRemoveSampleFromObservation,
    useAddUserToObservation,
    useRemoveUserFromObservation,
} from '@/hooks/useObservations';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useSamples } from '@/hooks/useSamples';
import { useFiles } from '@/hooks/useFiles';
import { useUsers } from '@/hooks/useUsers';
import { Button, Badge, RelationshipManager } from '@/components/common';
import { format } from 'date-fns';
import type {
    CatalystSimple,
    Catalyst,
    SampleSimple,
    Sample,
    FileMetadataSimple,
    FileMetadata,
    UserSimple,
    User,
} from '@/services/api';

export const ObservationDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const observationId = id ? parseInt(id) : undefined;

    // Fetch observation with all relationships
    const { data: obs, isLoading, error } = useObservation(
        observationId,
        'users,files,catalysts,samples'
    );

    // Fetch available items for relationship management
    const { data: allCatalysts, isLoading: isLoadingCatalysts } = useCatalysts({});
    const { data: allSamples, isLoading: isLoadingSamples } = useSamples({});
    const { data: allFiles, isLoading: isLoadingFiles } = useFiles({});
    const { data: allUsers, isLoading: isLoadingUsers } = useUsers({ is_active: true });

    // Mutations
    const deleteMutation = useDeleteObservation();
    const addFileMutation = useAddFileToObservation();
    const removeFileMutation = useRemoveFileFromObservation();
    const addCatalystMutation = useAddCatalystToObservation();
    const removeCatalystMutation = useRemoveCatalystFromObservation();
    const addSampleMutation = useAddSampleToObservation();
    const removeSampleMutation = useRemoveSampleFromObservation();
    const addUserMutation = useAddUserToObservation();
    const removeUserMutation = useRemoveUserFromObservation();

    const handleDelete = () => {
        if (!obs) return;
        if (window.confirm(`Are you sure you want to delete observation "${obs.objective}"?`)) {
            deleteMutation.mutate(obs.id, {
                onSuccess: () => navigate('/observations'),
            });
        }
    };

    // Helper to render JSONB data as a formatted list
    const renderJsonData = (data: Record<string, unknown>, title: string) => {
        const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
        if (entries.length === 0) return null;

        return (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    {title}
                </h2>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {entries.map(([key, value]) => (
                        <div key={key}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                                {key.replace(/_/g, ' ')}
                            </dt>
                            <dd style={{ margin: 0, fontFamily: typeof value === 'number' ? 'monospace' : 'inherit' }}>
                                {String(value)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
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
                        <h1 className="page-title" style={{ margin: 0 }}>{obs.objective}</h1>
                        {obs.has_calcination_data && (
                            <Badge variant="warning">Calcination</Badge>
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
                    {/* Observations Text */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Observations
                        </h2>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {obs.observations_text}
                        </div>
                    </div>

                    {/* Conclusions */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Conclusions
                        </h2>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {obs.conclusions}
                        </div>
                    </div>

                    {/* Process Conditions */}
                    {renderJsonData(obs.conditions, 'Process Conditions')}

                    {/* Calcination Parameters */}
                    {obs.has_calcination_data && renderJsonData(obs.calcination_parameters, 'Calcination Parameters')}

                    {/* Collected Data */}
                    {renderJsonData(obs.data, 'Collected Data')}

                    {/* Catalysts Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<CatalystSimple | Catalyst>
                            title="Linked Catalysts"
                            linkedItems={obs.catalysts || []}
                            availableItems={allCatalysts || []}
                            isLoadingAvailable={isLoadingCatalysts}
                            getItemName={(item) => item.name}
                            getItemSecondary={(item) => item.storage_location || ''}
                            itemLinkPrefix="/catalysts"
                            onAdd={(catalystId) =>
                                addCatalystMutation.mutate({ observationId: obs.id, catalystId })
                            }
                            onRemove={(catalystId) =>
                                removeCatalystMutation.mutate({ observationId: obs.id, catalystId })
                            }
                            isPending={addCatalystMutation.isPending || removeCatalystMutation.isPending}
                            emptyMessage="This observation is not linked to any catalysts."
                        />
                    </div>

                    {/* Samples Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<SampleSimple | Sample>
                            title="Linked Samples"
                            linkedItems={obs.samples || []}
                            availableItems={allSamples || []}
                            isLoadingAvailable={isLoadingSamples}
                            getItemName={(item) => item.name}
                            getItemSecondary={(item) => item.storage_location || ''}
                            itemLinkPrefix="/samples"
                            onAdd={(sampleId) =>
                                addSampleMutation.mutate({ observationId: obs.id, sampleId })
                            }
                            onRemove={(sampleId) =>
                                removeSampleMutation.mutate({ observationId: obs.id, sampleId })
                            }
                            isPending={addSampleMutation.isPending || removeSampleMutation.isPending}
                            emptyMessage="This observation is not linked to any samples."
                        />
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
                                    Created
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {format(new Date(obs.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                                </dd>
                            </div>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Last Updated
                                </dt>
                                <dd style={{ margin: 0 }}>
                                    {format(new Date(obs.updated_at), 'MMMM d, yyyy \'at\' h:mm a')}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Summary Stats */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Summary
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{obs.catalyst_count}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Catalysts</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{obs.sample_count}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Samples</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{obs.file_count}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Files</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{obs.users?.length || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Observers</div>
                            </div>
                        </div>
                    </div>

                    {/* Users/Observers Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<UserSimple | User>
                            title="Observers"
                            linkedItems={obs.users || []}
                            availableItems={allUsers || []}
                            isLoadingAvailable={isLoadingUsers}
                            getItemName={(item) => item.full_name || ('username' in item ? item.username : '')}
                            getItemSecondary={(item) => ('email' in item ? item.email : item.username)}
                            getItemBadge={(item) => ('is_active' in item && !item.is_active) ? { label: 'Inactive', variant: 'neutral' } : null}
                            itemLinkPrefix="/users"
                            onAdd={(userId) =>
                                addUserMutation.mutate({ observationId: obs.id, userId })
                            }
                            onRemove={(userId) =>
                                removeUserMutation.mutate({ observationId: obs.id, userId })
                            }
                            isPending={addUserMutation.isPending || removeUserMutation.isPending}
                            emptyMessage="No observers recorded for this observation."
                        />
                    </div>

                    {/* Files Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<FileMetadataSimple | FileMetadata>
                            title="Attached Files"
                            linkedItems={obs.files || []}
                            availableItems={allFiles || []}
                            isLoadingAvailable={isLoadingFiles}
                            getItemName={(item) => item.filename}
                            getItemSecondary={(item) => item.mime_type}
                            itemLinkPrefix="/files"
                            onAdd={(fileId) =>
                                addFileMutation.mutate({ observationId: obs.id, fileId })
                            }
                            onRemove={(fileId) =>
                                removeFileMutation.mutate({ observationId: obs.id, fileId })
                            }
                            isPending={addFileMutation.isPending || removeFileMutation.isPending}
                            emptyMessage="No files attached to this observation."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};