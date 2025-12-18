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
import { Button, TextInput, Badge } from '@/components/common';
import type { Group } from '@/services/api';
import { format } from 'date-fns';

export const GroupListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: groups, isLoading, error } = useGroups({
        search: search || undefined,
        include: 'experiments',
    });
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
                    {groups.length === 0 ? (
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
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            {groups.map((group) => (
                                <div key={group.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <Link
                                                    to={`/groups/${group.id}`}
                                                    style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
                                                >
                                                    {group.name}
                                                </Link>
                                                <Badge variant="info">
                                                    {group.experiment_count || group.experiments?.length || 0} experiments
                                                </Badge>
                                            </div>
                                            {group.purpose && (
                                                <p style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-text-secondary)' }}>
                                                    {group.purpose}
                                                </p>
                                            )}
                                            {group.conclusion && (
                                                <p style={{
                                                    margin: 'var(--spacing-sm) 0 0 0',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--color-text-secondary)',
                                                    fontStyle: 'italic',
                                                }}>
                                                    Conclusion: {group.conclusion.length > 100
                                                    ? group.conclusion.substring(0, 100) + '...'
                                                    : group.conclusion}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                {format(new Date(group.created_at), 'MMM d, yyyy')}
                                            </span>
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {groups.length} group{groups.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};