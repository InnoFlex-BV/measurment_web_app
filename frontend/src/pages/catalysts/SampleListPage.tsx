/**
 * SampleListPage - List view for all samples with filtering.
 *
 * Samples represent prepared portions of catalysts for testing. This page
 * provides comprehensive filtering by source catalyst, support material,
 * preparation method, and depletion status.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSamples, useDeleteSample } from '@/hooks/useSamples';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useSupports } from '@/hooks/useSupports';
import { useMethods } from '@/hooks/useMethods';
import { Button, TextInput, Select, Badge } from '@/components/common';
import type { Sample } from '@/services/api';
import { format } from 'date-fns';

export const SampleListPage: React.FC = () => {
    // Filter state
    const [search, setSearch] = useState('');
    const [catalystId, setCatalystId] = useState<number | undefined>(undefined);
    const [supportId, setSupportId] = useState<number | undefined>(undefined);
    const [methodId, setMethodId] = useState<number | undefined>(undefined);
    const [depleted, setDepleted] = useState<boolean | undefined>(undefined);

    // Data fetching
    const { data: samples, isLoading, error } = useSamples({
        search: search || undefined,
        catalyst_id: catalystId,
        support_id: supportId,
        method_id: methodId,
        depleted,
        include: 'catalyst,support,method,created_by',
    });

    // Filter dropdown data
    const { data: catalysts } = useCatalysts({ depleted: false });
    const { data: supports } = useSupports();
    const { data: methods } = useMethods({ is_active: true });

    const deleteMutation = useDeleteSample();

    const handleDelete = (sample: Sample) => {
        if (window.confirm(`Are you sure you want to delete sample "${sample.name}"?`)) {
            deleteMutation.mutate({ id: sample.id });
        }
    };

    /**
     * Calculate usage percentage for display
     */
    const getUsagePercentage = (sample: Sample): number => {
        const yield_amt = parseFloat(sample.yield_amount);
        const remaining = parseFloat(sample.remaining_amount);
        if (yield_amt === 0) return 0;
        return Math.round(((yield_amt - remaining) / yield_amt) * 100);
    };

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Samples</h1>
                    <p className="page-description">Prepared catalyst portions for testing and experiments</p>
                </div>
                <Link to="/samples/new">
                    <Button variant="primary">Create Sample</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Source Catalyst</label>
                        <Select
                            value={catalystId ?? ''}
                            onChange={(e) => setCatalystId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Catalysts</option>
                            {catalysts?.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Support</label>
                        <Select
                            value={supportId ?? ''}
                            onChange={(e) => setSupportId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Supports</option>
                            {supports?.map((sup) => (
                                <option key={sup.id} value={sup.id}>{sup.descriptive_name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Method</label>
                        <Select
                            value={methodId ?? ''}
                            onChange={(e) => setMethodId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Methods</option>
                            {methods?.map((m) => (
                                <option key={m.id} value={m.id}>{m.descriptive_name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <Select
                            value={depleted === undefined ? '' : depleted.toString()}
                            onChange={(e) => {
                                if (e.target.value === '') setDepleted(undefined);
                                else setDepleted(e.target.value === 'true');
                            }}
                        >
                            <option value="">All</option>
                            <option value="false">Available</option>
                            <option value="true">Depleted</option>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-container">
                    <p>Loading samples...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading samples. Please try again.</p>
                </div>
            )}

            {/* Samples Table */}
            {samples && (
                <>
                    {samples.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No samples found. {search && 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                    <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Source Catalyst</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Support</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Method</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Inventory</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Created</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {samples.map((sample) => (
                                        <tr key={sample.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <Link
                                                    to={`/samples/${sample.id}`}
                                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    {sample.name}
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {sample.catalyst ? (
                                                    <Link to={`/catalysts/${sample.catalyst.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {sample.catalyst.name}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {sample.support?.descriptive_name || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {sample.method?.descriptive_name || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right', fontFamily: 'monospace' }}>
                                                    <span title={`${sample.remaining_amount} / ${sample.yield_amount}`}>
                                                        {parseFloat(sample.remaining_amount).toFixed(2)} g
                                                    </span>
                                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                                        ({getUsagePercentage(sample)}% used)
                                                    </span>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {sample.is_depleted ? (
                                                    <Badge variant="danger" size="sm">Depleted</Badge>
                                                ) : (
                                                    <Badge variant="success" size="sm">Available</Badge>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {format(new Date(sample.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                    <Link to={`/samples/${sample.id}`}>
                                                        <Button variant="secondary" size="sm">View</Button>
                                                    </Link>
                                                    <Link to={`/samples/${sample.id}/edit`}>
                                                        <Button variant="secondary" size="sm">Edit</Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(sample)}
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
                        Showing {samples.length} sample{samples.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};