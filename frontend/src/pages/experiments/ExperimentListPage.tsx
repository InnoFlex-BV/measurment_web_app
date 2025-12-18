/**
 * ExperimentListPage - List view for all experiments.
 *
 * Experiments are the core data collection entities, recording conditions
 * and results of catalytic testing. Displays Plasma, Photocatalysis, and
 * Misc experiment types with their type-specific information.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperiments, useDeleteExperiment } from '@/hooks/useExperiments';
import { useReactors } from '@/hooks/useReactors';
import { useGroups } from '@/hooks/useGroups';
import { Button, TextInput, Select, Badge } from '@/components/common';
import {
    type Experiment,
    type ExperimentType,
    EXPERIMENT_TYPE_LABELS,
    isPlasmaExperiment,
    isPhotocatalysisExperiment,
} from '@/services/api';
import { format } from 'date-fns';

export const ExperimentListPage: React.FC = () => {
    // Filter state
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<ExperimentType | ''>('');
    const [reactorId, setReactorId] = useState<number | ''>('');
    const [groupId, setGroupId] = useState<number | ''>('');
    const [hasConclusion, setHasConclusion] = useState<boolean | ''>('');

    // Data fetching
    const { data: experiments, isLoading, error } = useExperiments({
        search: search || undefined,
        experiment_type: typeFilter || undefined,
        reactor_id: reactorId || undefined,
        group_id: groupId || undefined,
        has_conclusion: hasConclusion === '' ? undefined : hasConclusion,
        include: 'reactor,analyzer,samples',
    });

    // Filter dropdown data
    const { data: reactors } = useReactors();
    const { data: groups } = useGroups();

    const deleteMutation = useDeleteExperiment();

    const handleDelete = (experiment: Experiment) => {
        if (window.confirm(`Are you sure you want to delete experiment "${experiment.name}"?`)) {
            deleteMutation.mutate(experiment.id);
        }
    };

    /**
     * Get badge color based on experiment type
     */
    const getTypeBadgeVariant = (type: ExperimentType): 'info' | 'success' | 'warning' => {
        switch (type) {
            case 'plasma':
                return 'info';
            case 'photocatalysis':
                return 'success';
            case 'misc':
                return 'warning';
        }
    };

    /**
     * Get type-specific info display
     */
    const getTypeInfo = (experiment: Experiment): string => {
        if (isPlasmaExperiment(experiment)) {
            const parts = [];
            if (experiment.delivered_power) parts.push(`${experiment.delivered_power} W`);
            if (experiment.is_pulsed) parts.push('Pulsed');
            return parts.join(', ') || '-';
        }
        if (isPhotocatalysisExperiment(experiment)) {
            const parts = [];
            if (experiment.wavelength) parts.push(`${experiment.wavelength} nm`);
            if (experiment.power) parts.push(`${experiment.power} W`);
            return parts.join(', ') || '-';
        }
        return '-';
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Experiments</h1>
                    <p className="page-description">Catalytic testing and data collection</p>
                </div>
                <Link to="/experiments/new">
                    <Button variant="primary">New Experiment</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by name or purpose..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as ExperimentType | '')}
                        >
                            <option value="">All Types</option>
                            <option value="plasma">Plasma Catalysis</option>
                            <option value="photocatalysis">Photocatalysis</option>
                            <option value="misc">Miscellaneous</option>
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <Select
                            value={hasConclusion === '' ? '' : hasConclusion.toString()}
                            onChange={(e) => setHasConclusion(e.target.value === '' ? '' : e.target.value === 'true')}
                        >
                            <option value="">All</option>
                            <option value="true">Completed (has conclusion)</option>
                            <option value="false">In Progress</option>
                        </Select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Reactor</label>
                        <Select
                            value={reactorId}
                            onChange={(e) => setReactorId(e.target.value ? parseInt(e.target.value) : '')}
                        >
                            <option value="">All Reactors</option>
                            {reactors?.map((reactor) => (
                                <option key={reactor.id} value={reactor.id}>
                                    {reactor.description
                                        ? (reactor.description.length > 30
                                            ? reactor.description.substring(0, 30) + '...'
                                            : reactor.description)
                                        : `Reactor #${reactor.id}`}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Group</label>
                        <Select
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value) : '')}
                        >
                            <option value="">All Groups</option>
                            {groups?.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading experiments...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading experiments. Please try again.</p>
                </div>
            )}

            {experiments && (
                <>
                    {experiments.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No experiments found</h3>
                            <p className="empty-state-description">
                                {search || typeFilter || reactorId || groupId
                                    ? 'Try adjusting your filters.'
                                    : 'Get started by creating your first experiment.'}
                            </p>
                            {!search && !typeFilter && !reactorId && !groupId && (
                                <Link to="/experiments/new">
                                    <Button variant="primary">Create First Experiment</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Purpose</th>
                                    <th>Parameters</th>
                                    <th>Samples</th>
                                    <th>Status</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {experiments.map((experiment) => (
                                    <tr key={experiment.id}>
                                        <td>
                                            <Link
                                                to={`/experiments/${experiment.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {experiment.name}
                                            </Link>
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-secondary)',
                                                margin: '0.25rem 0 0 0',
                                            }}>
                                                {format(new Date(experiment.created_at), 'MMM d, yyyy')}
                                            </p>
                                        </td>
                                        <td>
                                            <Badge variant={getTypeBadgeVariant(experiment.experiment_type)}>
                                                {EXPERIMENT_TYPE_LABELS[experiment.experiment_type]}
                                            </Badge>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                                <span style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {experiment.purpose}
                                                </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>
                                            {getTypeInfo(experiment)}
                                        </td>
                                        <td>
                                            {experiment.sample_count || experiment.samples?.length || 0}
                                        </td>
                                        <td>
                                            <Badge variant={experiment.has_conclusion ? 'success' : 'warning'}>
                                                {experiment.has_conclusion ? 'Completed' : 'In Progress'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/experiments/${experiment.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(experiment)}
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
                    )}
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {experiments.length} experiment{experiments.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};