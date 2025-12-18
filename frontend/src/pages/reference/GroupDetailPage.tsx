/**
 * GroupDetailPage - Detail view for a single experiment group.
 *
 * Shows group details and all experiments belonging to this group.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGroup, useDeleteGroup } from '@/hooks/useGroups.ts';
import { Button, Badge } from '@/components/common';
import { EXPERIMENT_TYPE_LABELS, type ExperimentType } from '@/services/api';
import { format } from 'date-fns';

/**
 * Get badge color based on experiment type
 */
function getExperimentTypeBadgeVariant(type: ExperimentType): 'info' | 'success' | 'warning' {
    switch (type) {
        case 'plasma':
            return 'info';
        case 'photocatalysis':
            return 'success';
        case 'misc':
            return 'warning';
        default:
            return 'info';
    }
}

export const GroupDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const groupId = id ? parseInt(id) : undefined;

    const { data: group, isLoading, error } = useGroup(groupId, 'experiments,discussed_in_file');
    const deleteMutation = useDeleteGroup();

    const handleDelete = () => {
        if (!group) return;

        if (window.confirm(`Are you sure you want to delete group "${group.name}"? This will not delete the experiments in it.`)) {
            deleteMutation.mutate(group.id, {
                onSuccess: () => {
                    navigate('/groups');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading group...</p>
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Group not found or error loading data.</p>
                    <Link to="/groups">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Groups
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
                    <Link
                        to="/groups"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Groups
                    </Link>
                    <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                        {group.name}
                    </h1>
                    {group.purpose && (
                        <p className="page-description">{group.purpose}</p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/groups/${group.id}/edit`}>
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

            {/* Basic Info */}
            <div className="card">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Created
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(group.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(group.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Experiments
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {group.experiment_count || group.experiments?.length || 0}
                        </p>
                    </div>
                    {group.discussed_in_file && (
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Discussion File
                            </p>
                            <Link
                                to={`/files/${group.discussed_in_file.id}`}
                                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                            >
                                {group.discussed_in_file.filename}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Method */}
            {group.method && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Method
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{group.method}</p>
                </div>
            )}

            {/* Conclusion */}
            {group.conclusion && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Conclusion
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{group.conclusion}</p>
                </div>
            )}

            {/* Experiments in Group */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Experiments ({group.experiments?.length || 0})
                    </h2>
                    <Link to="/experiments/new">
                        <Button variant="secondary" size="sm">Add Experiment</Button>
                    </Link>
                </div>
                {group.experiments && group.experiments.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {group.experiments.map((experiment) => (
                            <Link
                                key={experiment.id}
                                to={`/experiments/${experiment.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                        {experiment.name}
                                    </span>
                                    <Badge variant={getExperimentTypeBadgeVariant(experiment.experiment_type)}>
                                        {EXPERIMENT_TYPE_LABELS[experiment.experiment_type]}
                                    </Badge>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {experiment.purpose}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No experiments in this group yet. Add experiments to compare and analyze together.
                    </p>
                )}
            </div>
        </div>
    );
};
