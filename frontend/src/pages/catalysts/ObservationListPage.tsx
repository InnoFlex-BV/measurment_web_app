/**
 * ObservationListPage - List view for all observations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. This page provides filtering by calcination data and search.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useObservations, useDeleteObservation } from '@/hooks/useObservations';
import { useSortableData } from '@/hooks';
import { Button, TextInput, Select, Badge, SortableHeader } from '@/components/common';
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

    const { sortedData, requestSort, getSortDirection } = useSortableData(observations, { key: 'created_at', direction: 'desc' });
    const deleteMutation = useDeleteObservation();

    const handleDelete = (obs: Observation) => {
        if (window.confirm(`Are you sure you want to delete observation "${obs.objective}"?`)) {
            deleteMutation.mutate(obs.id);
        }
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

            {/* Observations Table */}
            {observations && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No observations found. {search && 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                    <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                        <SortableHeader label="Objective" sortKey="objective" currentDirection={getSortDirection('objective')} onSort={requestSort} />
                                        <SortableHeader label="Conclusions" sortKey="conclusions" currentDirection={getSortDirection('conclusions')} onSort={requestSort} />
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Researchers</th>
                                        <SortableHeader label="Calcination" sortKey="has_calcination_data" currentDirection={getSortDirection('has_calcination_data')} onSort={requestSort} />
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Links</th>
                                        <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedData.map((obs) => (
                                        <tr key={obs.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', maxWidth: '250px' }}>
                                                <Link
                                                    to={`/observations/${obs.id}`}
                                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    <span style={{
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {obs.objective}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', maxWidth: '300px' }}>
                                                <span style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--color-text-secondary)',
                                                    fontStyle: 'italic',
                                                }}>
                                                    {obs.conclusions || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {obs.users && obs.users.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                        {obs.users.slice(0, 2).map((user) => (
                                                            <Link
                                                                key={user.id}
                                                                to={`/users/${user.id}`}
                                                                style={{
                                                                    color: 'var(--color-primary)',
                                                                    textDecoration: 'none',
                                                                    fontSize: '0.875rem',
                                                                }}
                                                            >
                                                                {user.full_name || user.username}
                                                            </Link>
                                                        ))}
                                                        {obs.users.length > 2 && (
                                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                                +{obs.users.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {obs.has_calcination_data ? (
                                                    <Badge variant="warning" size="sm">Yes</Badge>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
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
                                                    {(obs.catalyst_count ?? 0) === 0 && (obs.sample_count ?? 0) === 0 && (obs.file_count ?? 0) === 0 && (
                                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No links</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {format(new Date(obs.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
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
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {sortedData.length} observation{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};