/**
 * AnalyzerListPage - List view for all analyzers.
 *
 * Analyzers are instruments used to measure experimental outputs.
 * Displays both FTIR and OES analyzer types with their type-specific fields.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyzers, useDeleteAnalyzer } from '@/hooks/useAnalyzers';
import { useSortableData } from '@/hooks';
import { Button, TextInput, Select, Badge, SortableHeader } from '@/components/common';
import {
    type Analyzer,
    type AnalyzerType,
    ANALYZER_TYPE_LABELS,
    isFTIRAnalyzer,
    isOESAnalyzer,
} from '@/services/api';
import { format } from 'date-fns';

export const AnalyzerListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<AnalyzerType | ''>('');

    const { data: analyzers, isLoading, error } = useAnalyzers({
        search: search || undefined,
        analyzer_type: typeFilter || undefined,
        include: 'experiments',
    });
    const { sortedData, requestSort, getSortDirection } = useSortableData(analyzers, { key: 'name', direction: 'asc' });
    const deleteMutation = useDeleteAnalyzer();

    const handleDelete = (analyzer: Analyzer) => {
        if (window.confirm(`Are you sure you want to delete analyzer "${analyzer.name}"?`)) {
            deleteMutation.mutate({ id: analyzer.id });
        }
    };

    /**
     * Get badge color based on analyzer type
     */
    const getTypeBadgeVariant = (type: AnalyzerType): 'info' | 'success' => {
        return type === 'ftir' ? 'info' : 'success';
    };

    /**
     * Get type-specific info display
     */
    const getTypeInfo = (analyzer: Analyzer): string => {
        if (isFTIRAnalyzer(analyzer)) {
            const parts = [];
            if (analyzer.resolution) parts.push(`${analyzer.resolution} cm⁻¹`);
            if (analyzer.scans) parts.push(`${analyzer.scans} scans`);
            return parts.join(', ') || '-';
        }
        if (isOESAnalyzer(analyzer)) {
            const parts = [];
            if (analyzer.integration_time) parts.push(`${analyzer.integration_time} ms`);
            if (analyzer.scans) parts.push(`${analyzer.scans} scans`);
            return parts.join(', ') || '-';
        }
        return '-';
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Analyzers</h1>
                    <p className="page-description">Instruments for measuring experimental outputs</p>
                </div>
                <Link to="/analyzers/new">
                    <Button variant="primary">Add Analyzer</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by analyzer name or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as AnalyzerType | '')}
                        >
                            <option value="">All Types</option>
                            <option value="ftir">FTIR Spectrometer</option>
                            <option value="oes">Optical Emission Spectrometer</option>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading analyzers...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading analyzers. Please try again.</p>
                </div>
            )}

            {analyzers && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No analyzers found</h3>
                            <p className="empty-state-description">
                                {search || typeFilter
                                    ? 'Try adjusting your filters.'
                                    : 'Get started by adding your first analyzer.'}
                            </p>
                            {!search && !typeFilter && (
                                <Link to="/analyzers/new">
                                    <Button variant="primary">Add First Analyzer</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                    <SortableHeader label="Type" sortKey="analyzer_type" currentDirection={getSortDirection('analyzer_type')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Configuration</th>
                                    <SortableHeader label="Experiments" sortKey="experiment_count" currentDirection={getSortDirection('experiment_count')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', width: '150px' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((analyzer) => (
                                    <tr key={analyzer.id}>
                                        <td>
                                            <Link
                                                to={`/analyzers/${analyzer.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {analyzer.name}
                                            </Link>
                                            {analyzer.description && (
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-secondary)',
                                                    margin: '0.25rem 0 0 0',
                                                }}>
                                                    {analyzer.description.length > 40
                                                        ? analyzer.description.substring(0, 40) + '...'
                                                        : analyzer.description}
                                                </p>
                                            )}
                                        </td>
                                        <td>
                                            <Badge variant={getTypeBadgeVariant(analyzer.analyzer_type)}>
                                                {ANALYZER_TYPE_LABELS[analyzer.analyzer_type]}
                                            </Badge>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>
                                            {getTypeInfo(analyzer)}
                                        </td>
                                        <td>
                                            <Badge variant={analyzer.is_in_use ? 'success' : 'neutral'}>
                                                {analyzer.experiment_count || 0}
                                            </Badge>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(analyzer.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/analyzers/${analyzer.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(analyzer)}
                                                    disabled={deleteMutation.isPending || analyzer.is_in_use}
                                                    title={analyzer.is_in_use ? 'Cannot delete analyzer in use' : ''}
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
                        {sortedData.length} analyzer{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};