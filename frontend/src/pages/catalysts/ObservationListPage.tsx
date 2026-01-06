/**
 * ObservationListPage - List view for all observations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. This page provides filtering by calcination data and search.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useObservations, useDeleteObservation } from '@/hooks/useObservations';
import { Button, TextInput, Select, Badge } from '@/components/common';
import type { Observation } from '@/services/api';
import { format } from 'date-fns';

export const ObservationListPage: React.FC = () => {
    // Filter state
    const [search, setSearch] = useState('');
    const [hasCalcination, setHasCalcination] = useState<boolean | undefined>(undefined);

    // Data fetching
    const { data: observations, isLoading, error } = useObservations({
        search: search || undefined,
        has_calcination: hasCalcination,
        include: 'users,catalysts,samples,files',
    });

    const deleteMutation = useDeleteObservation();

    const handleDelete = (obs: Observation) => {
        if (window.confirm(`Are you sure you want to delete observation "${obs.objective}"?`)) {
            deleteMutation.mutate(obs.id);
        }
    };

    // Helper to format conditions for display
    const formatConditions = (conditions: Record<string, unknown>) => {
        const parts: string[] = [];
        if (conditions.temperature) {
            parts.push(`${conditions.temperature}${conditions.temperature_unit || '°C'}`);
        }
        if (conditions.atmosphere) {
            parts.push(String(conditions.atmosphere));
        }
        if (conditions.duration) {
            parts.push(`${conditions.duration} ${conditions.duration_unit || 'hrs'}`);
        }
        return parts.join(' / ') || null;
    };

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Observations</h1>
                    <p className="page-description">Qualitative research notes and process documentation</p>
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
                            placeholder="Search objective or observations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Calcination Data</label>
                        <Select
                            value={hasCalcination === undefined ? '' : hasCalcination.toString()}
                            onChange={(e) => setHasCalcination(
                                e.target.value === '' ? undefined : e.target.value === 'true'
                            )}
                        >
                            <option value="">All</option>
                            <option value="true">Has Calcination Data</option>
                            <option value="false">No Calcination Data</option>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--spacing-md)' }}>
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
                                            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', flex: 1 }}
                                        >
                                            {obs.objective}
                                        </Link>
                                        {obs.has_calcination_data && (
                                            <Badge variant="warning" size="sm">Calcination</Badge>
                                        )}
                                    </div>

                                    {/* Conditions Preview */}
                                    {formatConditions(obs.conditions) && (
                                        <p style={{
                                            margin: '0 0 var(--spacing-xs)',
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-secondary)',
                                            fontFamily: 'monospace',
                                        }}>
                                            {formatConditions(obs.conditions)}
                                        </p>
                                    )}

                                    {/* Observations Preview */}
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
                                        {obs.observations_text}
                                    </p>

                                    {/* Conclusions Preview */}
                                    <p style={{
                                        margin: 0,
                                        marginBottom: 'var(--spacing-sm)',
                                        fontSize: '0.8rem',
                                        fontStyle: 'italic',
                                        color: 'var(--color-text-secondary)',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        Conclusion: {obs.conclusions}
                                    </p>

                                    {/* Meta Info */}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                        {obs.users && obs.users.length > 0 && (
                                            <span>
                                                By {obs.users.map(u => u.full_name || u.username).join(', ')}
                                            </span>
                                        )}
                                        <span> {format(new Date(obs.created_at), 'MMM d, yyyy')}</span>
                                    </div>

                                    {/* Links & Attachments */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginBottom: 'var(--spacing-sm)' }}>
                                        {(obs.catalyst_count ?? 0) > 0 && (
                                            <Badge variant="info" size="sm">
                                                {obs.catalyst_count} catalyst{obs.catalyst_count !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {(obs.sample_count ?? 0) > 0 && (
                                            <Badge variant="success" size="sm">
                                                {obs.sample_count} sample{obs.sample_count !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {(obs.file_count ?? 0) > 0 && (
                                            <Badge variant="neutral" size="sm">
                                                {obs.file_count} file{obs.file_count !== 1 ? 's' : ''}
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