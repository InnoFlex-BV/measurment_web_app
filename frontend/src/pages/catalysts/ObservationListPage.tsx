/**
 * ObservationListPage - List view for all observations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. This page provides filtering by type, observer, and search.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useObservations, useDeleteObservation } from '@/hooks/useObservations';
import { useUsers } from '@/hooks/useUsers';
import { Button, TextInput, Select, Badge } from '@/components/common';
import type { Observation } from '@/services/api';
import { format } from 'date-fns';

export const ObservationListPage: React.FC = () => {
    // Filter state
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [observedBy, setObservedBy] = useState<number | undefined>(undefined);

    // Data fetching
    const { data: observations, isLoading, error } = useObservations({
        search: search || undefined,
        observation_type: typeFilter || undefined,
        observed_by: observedBy,
        include: 'observed_by,catalysts,samples,files',
    });

    const { data: users } = useUsers({ is_active: true });
    const deleteMutation = useDeleteObservation();

    const handleDelete = (obs: Observation) => {
        if (window.confirm(`Are you sure you want to delete observation "${obs.title}"?`)) {
            deleteMutation.mutate(obs.id);
        }
    };

    // Extract unique observation types from data for filter dropdown
    const observationTypes = React.useMemo(() => {
        if (!observations) return [];
        const types = new Set(observations.map((o) => o.observation_type).filter(Boolean));
        return Array.from(types) as string[];
    }, [observations]);

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Observations</h1>
                    <p className="page-description">Qualitative research notes and findings</p>
                </div>
                <Link to="/observations/new">
                    <Button variant="primary">Add Observation</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search title or content..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {observationTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Observed By</label>
                        <Select
                            value={observedBy ?? ''}
                            onChange={(e) => setObservedBy(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Users</option>
                            {users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.username}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-container">
                    <p>Loading observations...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading observations. Please try again.</p>
                </div>
            )}

            {/* Observations Grid */}
            {observations && (
                <>
                    {observations.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No observations found. {search && 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-md)' }}>
                            {observations.map((obs) => (
                                <div
                                    key={obs.id}
                                    className="card"
                                    style={{ display: 'flex', flexDirection: 'column' }}
                                >
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                        <Link
                                            to={`/observations/${obs.id}`}
                                            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}
                                        >
                                            {obs.title}
                                        </Link>
                                        {obs.observation_type && (
                                            <Badge variant="neutral" size="sm">{obs.observation_type}</Badge>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <p style={{
                                        flex: 1,
                                        margin: 0,
                                        marginBottom: 'var(--spacing-sm)',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-secondary)',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {obs.content}
                                    </p>

                                    {/* Meta Info */}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                        {obs.observed_by && (
                                            <span>By {obs.observed_by.full_name || obs.observed_by.username}</span>
                                        )}
                                        {obs.observed_at && (
                                            <span> • {format(new Date(obs.observed_at), 'MMM d, yyyy')}</span>
                                        )}
                                    </div>

                                    {/* Links & Attachments */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginBottom: 'var(--spacing-sm)' }}>
                                        {obs.catalysts && obs.catalysts.length > 0 && (
                                            <Badge variant="info" size="sm">
                                                {obs.catalysts.length} catalyst{obs.catalysts.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {obs.samples && obs.samples.length > 0 && (
                                            <Badge variant="success" size="sm">
                                                {obs.samples.length} sample{obs.samples.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {obs.files && obs.files.length > 0 && (
                                            <Badge variant="warning" size="sm">
                                                {obs.files.length} file{obs.files.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-sm)', marginTop: 'auto' }}>
                                        <Link to={`/observations/${obs.id}`}>
                                            <Button variant="secondary" size="sm">View</Button>
                                        </Link>
                                        <Link to={`/observations/${obs.id}/edit`}>
                                            <Button variant="secondary" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(obs)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {observations.length} observation{observations.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};