/**
 * GroupListPage - List view for all experiment groups.
 *
 * Groups are collections of related experiments for analysis.
 * They help organize experiments by research theme, project, or
 * comparison sets.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroups, useDeleteGroup } from '@/hooks/useGroups.ts';
import { useSortableData } from '@/hooks';
import { Button, TextInput, Badge, SortableHeader } from '@/components/common';
import type { Group } from '@/services/api';
import { format } from 'date-fns';

export const GroupListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: groups, isLoading, error } = useGroups({
        search: search || undefined,
        include: 'experiments',
    });
    const { sortedData, requestSort, getSortDirection } = useSortableData(groups, { key: 'name', direction: 'asc' });
    const deleteMutation = useDeleteGroup();

    const handleDelete = (group: Group) => {
        if (window.confirm(`Are you sure you want to delete group "${group.name}"? This will not delete the experiments in it.`)) {
            deleteMutation.mutate(group.id);
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Experiment Groups</h1>
                    <p className="page-description">Organize related experiments for analysis</p>
                </div>
                <Link to="/groups/new">
                    <Button variant="primary">Create Group</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by group name or purpose..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading groups...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading groups. Please try again.</p>
                </div>
            )}

            {groups && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No groups found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search terms.'
                                    : 'Create your first group to organize experiments.'}
                            </p>
                            {!search && (
                                <Link to="/groups/new">
                                    <Button variant="primary">Create First Group</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                        <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                        <SortableHeader label="Purpose" sortKey="purpose" currentDirection={getSortDirection('purpose')} onSort={requestSort} />
                                        <SortableHeader label="Conclusion" sortKey="conclusion" currentDirection={getSortDirection('conclusion')} onSort={requestSort} />
                                        <SortableHeader label="Experiments" sortKey="experiment_count" currentDirection={getSortDirection('experiment_count')} onSort={requestSort} />
                                        <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedData.map((group) => (
                                        <tr key={group.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <Link
                                                    to={`/groups/${group.id}`}
                                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    {group.name}
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', maxWidth: '250px' }}>
                                                {group.purpose ? (
                                                    <span style={{
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        {group.purpose}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', maxWidth: '250px' }}>
                                                {group.conclusion ? (
                                                    <span style={{
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: '0.875rem',
                                                        fontStyle: 'italic',
                                                    }}>
                                                        {group.conclusion}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <Badge variant="info">
                                                    {group.experiment_count || group.experiments?.length || 0}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {format(new Date(group.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                    <Link to={`/groups/${group.id}`}>
                                                        <Button variant="secondary" size="sm">View</Button>
                                                    </Link>
                                                    <Link to={`/groups/${group.id}/edit`}>
                                                        <Button variant="secondary" size="sm">Edit</Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(group)}
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
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {sortedData.length} group{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};