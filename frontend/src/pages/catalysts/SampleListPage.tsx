/**
 * SampleListPage - List view for all samples with filtering and sorting.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSamples, useDeleteSample, useSortableData } from '@/hooks';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useSupports } from '@/hooks/useSupports';
import { useMethods } from '@/hooks/useMethods';
import { Button, TextInput, Select, Badge, SortableHeader } from '@/components/common';
import type { Sample } from '@/services/api';

export const SampleListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [catalystId, setCatalystId] = useState<number | undefined>(undefined);
    const [supportId, setSupportId] = useState<number | undefined>(undefined);
    const [methodId, setMethodId] = useState<number | undefined>(undefined);
    const [depleted, setDepleted] = useState<boolean | undefined>(undefined);

    const { data: samples, isLoading, error } = useSamples({
        search: search || undefined,
        catalyst_id: catalystId,
        support_id: supportId,
        method_id: methodId,
        depleted,
        include: 'catalyst,support,method,created_by',
    });

    const { sortedData, requestSort, getSortDirection } = useSortableData(samples, { key: 'name', direction: 'asc' });
    const { data: catalysts } = useCatalysts({ depleted: false });
    const { data: supports } = useSupports();
    const { data: methods } = useMethods({ is_active: true });
    const deleteMutation = useDeleteSample();

    const handleDelete = (sample: Sample) => {
        if (window.confirm(`Are you sure you want to delete sample "${sample.name}"?`)) {
            deleteMutation.mutate({ id: sample.id });
        }
    };

    const getRemainingPercentage = (sample: Sample): number => {
        const yield_amt = parseFloat(sample.yield_amount);
        const remaining = parseFloat(sample.remaining_amount);
        if (yield_amt === 0) return 0;
        return Math.round((remaining / yield_amt) * 100);
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Samples</h1>
                    <p className="page-description">Prepared catalyst portions for testing and experiments</p>
                </div>
                <Link to="/samples/new">
                    <Button variant="primary">Create Sample</Button>
                </Link>
            </div>

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

            {isLoading && (
                <div className="loading-container">
                    <p>Loading samples...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading samples. Please try again.</p>
                </div>
            )}

            {samples && (
                <>
                    {sortedData.length === 0 ? (
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
                                        <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                        <SortableHeader label="Source Catalyst" sortKey="catalyst.name" currentDirection={getSortDirection('catalyst.name')} onSort={requestSort} />
                                        <SortableHeader label="Support" sortKey="support.descriptive_name" currentDirection={getSortDirection('support.descriptive_name')} onSort={requestSort} />
                                        <SortableHeader label="Method" sortKey="method.descriptive_name" currentDirection={getSortDirection('method.descriptive_name')} onSort={requestSort} />
                                        <SortableHeader label="Inventory" sortKey="remaining_amount" currentDirection={getSortDirection('remaining_amount')} onSort={requestSort} align="right" />
                                        <SortableHeader label="Status" sortKey="is_depleted" currentDirection={getSortDirection('is_depleted')} onSort={requestSort} />
                                        <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedData.map((sample) => (
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
                                                    ({getRemainingPercentage(sample)}% left)
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {sample.is_depleted ? (
                                                    <Badge variant="danger" size="sm">Depleted</Badge>
                                                ) : (
                                                    <Badge variant="success" size="sm">Available</Badge>
                                                )}
                                            </td>
                                            <td>{new Date(sample.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <Link to={`/catalysts/${sample.id}`}>
                                                        <Button variant="secondary" className="table-action-button">View</Button>
                                                    </Link>
                                                    <Link to={`/catalysts/${sample.id}/edit`}>
                                                        <Button variant="secondary" className="table-action-button">Edit</Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        className="table-action-button"
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
                        Showing {sortedData.length} sample{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};