/**
 * CharacterizationDetailPage - Detail view for a single characterization.
 *
 * Displays comprehensive characterization information including type,
 * description, linked files, and relationships to catalysts, samples, and users
 * with add/remove management capabilities.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useCharacterization,
    useDeleteCharacterization,
    useAddCatalystToCharacterization,
    useRemoveCatalystFromCharacterization,
    useAddSampleToCharacterization,
    useRemoveSampleFromCharacterization,
    useAddUserToCharacterization,
    useRemoveUserFromCharacterization,
} from '@/hooks/useCharacterizations';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useSamples } from '@/hooks/useSamples';
import { useUsers } from '@/hooks/useUsers';
import { Button, Badge, RelationshipManager } from '@/components/common';
import { CHARACTERIZATION_TYPE_LABELS, type CharacterizationType } from '@/services/api';
import { format } from 'date-fns';
import type {
    CatalystSimple,
    Catalyst,
    SampleSimple,
    Sample,
    UserSimple,
    User,
} from '@/services/api';

export const CharacterizationDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const characterizationId = id ? parseInt(id) : undefined;

    // Fetch characterization with all relationships
    const { data: char, isLoading, error } = useCharacterization(
        characterizationId,
        'users,raw_data_file,processed_data_file,catalysts,samples'
    );

    // Fetch available items for relationship management
    const { data: allCatalysts, isLoading: isLoadingCatalysts } = useCatalysts({});
    const { data: allSamples, isLoading: isLoadingSamples } = useSamples({});
    const { data: allUsers, isLoading: isLoadingUsers } = useUsers({ is_active: true });

    // Mutations
    const deleteMutation = useDeleteCharacterization();
    const addCatalystMutation = useAddCatalystToCharacterization();
    const removeCatalystMutation = useRemoveCatalystFromCharacterization();
    const addSampleMutation = useAddSampleToCharacterization();
    const removeSampleMutation = useRemoveSampleFromCharacterization();
    const addUserMutation = useAddUserToCharacterization();
    const removeUserMutation = useRemoveUserFromCharacterization();

    const handleDelete = () => {
        if (!char) return;
        const typeLabel = CHARACTERIZATION_TYPE_LABELS[char.type_name as CharacterizationType] || char.type_name;
        if (window.confirm(`Are you sure you want to delete this ${typeLabel} characterization?`)) {
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

    const typeLabel = CHARACTERIZATION_TYPE_LABELS[char.type_name as CharacterizationType] || char.type_name;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>{typeLabel}</h1>
                        <Badge variant="info">{char.type_name}</Badge>
                    </div>
                    <p className="page-description">Characterization #{char.id}</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Main Content */}
                <div>
                    {/* Description */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Description
                        </h2>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {char.description || (
                                <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                    No description provided
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Data Files */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Data Files
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
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
                                            {char.raw_data_file.filename}
                                        </Link>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)' }}>No file attached</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
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
                                            {char.processed_data_file.filename}
                                        </Link>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-secondary)' }}>No file attached</span>
                                    )}
                                </dd>
                            </div>
                        </div>
                        <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            To change linked files, use the Edit button above.
                        </p>
                    </div>

                    {/* Catalysts Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<CatalystSimple | Catalyst>
                            title="Linked Catalysts"
                            linkedItems={char.catalysts || []}
                            availableItems={allCatalysts || []}
                            isLoadingAvailable={isLoadingCatalysts}
                            getItemName={(item) => item.name}
                            getItemSecondary={(item) => item.storage_location || ''}
                            itemLinkPrefix="/catalysts"
                            onAdd={(catalystId) =>
                                addCatalystMutation.mutate({ characterizationId: char.id, catalystId })
                            }
                            onRemove={(catalystId) =>
                                removeCatalystMutation.mutate({ characterizationId: char.id, catalystId })
                            }
                            isPending={addCatalystMutation.isPending || removeCatalystMutation.isPending}
                            emptyMessage="This characterization is not linked to any catalysts."
                        />
                    </div>

                    {/* Samples Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<SampleSimple | Sample>
                            title="Linked Samples"
                            linkedItems={char.samples || []}
                            availableItems={allSamples || []}
                            isLoadingAvailable={isLoadingSamples}
                            getItemName={(item) => item.name}
                            getItemSecondary={(item) => item.storage_location || ''}
                            itemLinkPrefix="/samples"
                            onAdd={(sampleId) =>
                                addSampleMutation.mutate({ characterizationId: char.id, sampleId })
                            }
                            onRemove={(sampleId) =>
                                removeSampleMutation.mutate({ characterizationId: char.id, sampleId })
                            }
                            isPending={addSampleMutation.isPending || removeSampleMutation.isPending}
                            emptyMessage="This characterization is not linked to any samples."
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
                                    Type
                                </dt>
                                <dd style={{ margin: 0, fontWeight: 500 }}>
                                    {typeLabel}
                                </dd>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Created
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

                    {/* Summary Stats */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            Summary
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{char.catalyst_count ?? char.catalysts?.length ?? 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Catalysts</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{char.sample_count ?? char.samples?.length ?? 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Samples</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(char.has_raw_data ? 1 : 0) + (char.has_processed_data ? 1 : 0)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Files</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{char.users?.length ?? 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Researchers</div>
                            </div>
                        </div>
                    </div>

                    {/* Users/Researchers Relationship Manager */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <RelationshipManager<UserSimple | User>
                            title="Researchers"
                            linkedItems={char.users || []}
                            availableItems={allUsers || []}
                            isLoadingAvailable={isLoadingUsers}
                            getItemName={(item) => item.full_name || ('username' in item ? item.username : '')}
                            getItemSecondary={(item) => ('email' in item ? item.email : item.username)}
                            getItemBadge={(item) => ('is_active' in item && !item.is_active) ? { label: 'Inactive', variant: 'neutral' } : null}
                            itemLinkPrefix="/users"
                            onAdd={(userId) =>
                                addUserMutation.mutate({ characterizationId: char.id, userId })
                            }
                            onRemove={(userId) =>
                                removeUserMutation.mutate({ characterizationId: char.id, userId })
                            }
                            isPending={addUserMutation.isPending || removeUserMutation.isPending}
                            emptyMessage="No researchers recorded for this characterization."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};