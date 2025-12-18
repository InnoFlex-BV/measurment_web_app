/**
 * ProcessedListPage - List view for processed experiment results.
 *
 * Displays calculated metrics (DRE, EY) with filtering capabilities.
 * DRE = Decomposition/Removal Efficiency (%)
 * EY = Energy Yield (g/kWh or mol/kWh)
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProcessedResults, useDeleteProcessed } from '@/hooks/useProcessed';
import { Button, Badge, TextInput } from '@/components/common';

export const ProcessedListPage: React.FC = () => {
    const [completeOnly, setCompleteOnly] = useState(false);
    const [minDre, setMinDre] = useState('');
    const [maxDre, setMaxDre] = useState('');
    const [minEy, setMinEy] = useState('');
    const [maxEy, setMaxEy] = useState('');

    // Build params object
    const params = useMemo(() => ({
        complete_only: completeOnly || undefined,
        min_dre: minDre ? parseFloat(minDre) : undefined,
        max_dre: maxDre ? parseFloat(maxDre) : undefined,
        min_ey: minEy ? parseFloat(minEy) : undefined,
        max_ey: maxEy ? parseFloat(maxEy) : undefined,
        include: 'experiments',
    }), [completeOnly, minDre, maxDre, minEy, maxEy]);

    const { data: results, isLoading, error } = useProcessedResults(params);
    const deleteMutation = useDeleteProcessed();

    const handleDelete = (result: { id: number }) => {
        if (window.confirm(`Are you sure you want to delete processed result #${result.id}?`)) {
            deleteMutation.mutate(result.id);
        }
    };

    const clearFilters = () => {
        setCompleteOnly(false);
        setMinDre('');
        setMaxDre('');
        setMinEy('');
        setMaxEy('');
    };

    const hasFilters = completeOnly || minDre || maxDre || minEy || maxEy;

    /**
     * Format decimal value for display
     */
    const formatValue = (value: string | null | undefined, unit: string): string => {
        if (value === null || value === undefined) return '—';
        const num = parseFloat(value);
        return isNaN(num) ? '—' : `${num.toFixed(2)}${unit}`;
    };

    /**
     * Get badge variant based on DRE value
     */
    const getDreBadgeVariant = (dre: string | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' => {
        if (!dre) return 'neutral';
        const value = parseFloat(dre);
        if (isNaN(value)) return 'neutral';
        if (value >= 80) return 'success';
        if (value >= 50) return 'warning';
        return 'danger';
    };

    if (error) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Error loading processed results. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Processed Results</h1>
                    <p className="page-description">
                        Calculated performance metrics from experiments
                    </p>
                </div>
                <Link to="/processed/new">
                    <Button variant="primary">Add Result</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Filters</h3>
                    {hasFilters && (
                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {/* Complete Only Toggle */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={completeOnly}
                                onChange={(e) => setCompleteOnly(e.target.checked)}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Complete results only</span>
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0 1.5rem' }}>
                            Both DRE and EY recorded
                        </p>
                    </div>

                    {/* DRE Range */}
                    <div>
                        <label className="form-label">DRE Range (%)</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                            <TextInput
                                type="number"
                                placeholder="Min"
                                value={minDre}
                                onChange={(e) => setMinDre(e.target.value)}
                                style={{ width: '80px' }}
                            />
                            <span>–</span>
                            <TextInput
                                type="number"
                                placeholder="Max"
                                value={maxDre}
                                onChange={(e) => setMaxDre(e.target.value)}
                                style={{ width: '80px' }}
                            />
                        </div>
                    </div>

                    {/* EY Range */}
                    <div>
                        <label className="form-label">EY Range (g/kWh)</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                            <TextInput
                                type="number"
                                placeholder="Min"
                                value={minEy}
                                onChange={(e) => setMinEy(e.target.value)}
                                style={{ width: '80px' }}
                            />
                            <span>–</span>
                            <TextInput
                                type="number"
                                placeholder="Max"
                                value={maxEy}
                                onChange={(e) => setMaxEy(e.target.value)}
                                style={{ width: '80px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results List */}
            {isLoading ? (
                <div className="card">
                    <p>Loading processed results...</p>
                </div>
            ) : !results || results.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        {hasFilters
                            ? 'No processed results match your filters.'
                            : 'No processed results yet.'}
                    </p>
                    {!hasFilters && (
                        <Link to="/processed/new">
                            <Button variant="primary">Add First Result</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ID
                                </th>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    DRE
                                </th>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Energy Yield
                                </th>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Status
                                </th>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Experiments
                                </th>
                                <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {results.map((result) => (
                                <tr
                                    key={result.id}
                                    style={{ borderTop: '1px solid var(--color-border)' }}
                                >
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                        <Link
                                            to={`/processed/${result.id}`}
                                            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                        >
                                            #{result.id}
                                        </Link>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                                    {formatValue(result.dre, '%')}
                                                </span>
                                            {result.dre && (
                                                <Badge variant={getDreBadgeVariant(result.dre)} size="sm">
                                                    {parseFloat(result.dre) >= 80 ? 'High' : parseFloat(result.dre) >= 50 ? 'Medium' : 'Low'}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontFamily: 'monospace' }}>
                                        {formatValue(result.ey, ' g/kWh')}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                        <Badge variant={result.is_complete ? 'success' : 'warning'}>
                                            {result.is_complete ? 'Complete' : 'Partial'}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                        {result.experiments && result.experiments.length > 0 ? (
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {result.experiments.length} experiment{result.experiments.length !== 1 ? 's' : ''}
                                                </span>
                                        ) : (
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    None linked
                                                </span>
                                        )}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                            <Link to={`/processed/${result.id}`}>
                                                <Button variant="secondary" size="sm">View</Button>
                                            </Link>
                                            <Link to={`/processed/${result.id}/edit`}>
                                                <Button variant="secondary" size="sm">Edit</Button>
                                            </Link>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(result)}
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

            {/* Summary */}
            {results && results.length > 0 && (
                <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Showing {results.length} result{results.length !== 1 ? 's' : ''}
                    {hasFilters && ' (filtered)'}
                </p>
            )}
        </div>
    );
};