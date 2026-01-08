/**
 * CatalystListPage - List view for all catalysts with advanced filtering and sorting.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalysts, useDeleteCatalyst, useSortableData } from '@/hooks';
import { useMethods } from '@/hooks/useMethods';
import { Button, TextInput, Select, SortableHeader } from '@/components/common';
import type { Catalyst } from '@/services/api';

export const CatalystListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [methodId, setMethodId] = useState<number | undefined>(undefined);
    const [depleted, setDepleted] = useState<boolean | undefined>(undefined);

    const { data: catalysts, isLoading, error } = useCatalysts({
        search,
        method_id: methodId,
        depleted,
        include: 'method'
    });

    const { sortedData, requestSort, getSortDirection } = useSortableData(catalysts, { key: 'name', direction: 'asc' });
    const { data: methods } = useMethods({ is_active: true });
    const deleteMutation = useDeleteCatalyst();

    const handleDelete = (catalyst: Catalyst) => {
        if (window.confirm(`Are you sure you want to delete catalyst "${catalyst.name}"?`)) {
            deleteMutation.mutate(catalyst.id);
        }
    };

    const getUsagePercentage = (catalyst: Catalyst): number => {
        const yield_amount = parseFloat(catalyst.yield_amount);
        const remaining = parseFloat(catalyst.remaining_amount);
        if (yield_amount === 0) return 0;
        return (remaining / yield_amount) * 100;
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Catalysts</h1>
                    <p className="page-description">Manage synthesized catalyst materials and inventory</p>
                </div>
                <Link to="/catalysts/new">
                    <Button variant="primary">Create Catalyst</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--spacing-md)', alignItems: 'end' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by catalyst name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Method</label>
                        <Select
                            value={methodId || ''}
                            onChange={(e) => setMethodId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Methods</option>
                            {methods?.map(method => (
                                <option key={method.id} value={method.id}>{method.descriptive_name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Inventory Status</label>
                        <Select
                            value={depleted === undefined ? '' : String(depleted)}
                            onChange={(e) => setDepleted(e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <option value="">All Catalysts</option>
                            <option value="false">Available</option>
                            <option value="true">Depleted</option>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading catalysts...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading catalysts. Please try again.</p>
                </div>
            )}

            {catalysts && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No catalysts found</h3>
                            <p className="empty-state-description">
                                {search || methodId || depleted !== undefined
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first catalyst'}
                            </p>
                            <Link to="/catalysts/new">
                                <Button variant="primary">Create Catalyst</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                    <SortableHeader label="Method" sortKey="method.descriptive_name" currentDirection={getSortDirection('method.descriptive_name')} onSort={requestSort} />
                                    <SortableHeader label="Yield" sortKey="yield_amount" currentDirection={getSortDirection('yield_amount')} onSort={requestSort} />
                                    <SortableHeader label="Remaining" sortKey="remaining_amount" currentDirection={getSortDirection('remaining_amount')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Usage</th>
                                    <SortableHeader label="Storage" sortKey="storage_location" currentDirection={getSortDirection('storage_location')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((catalyst) => {
                                    const usagePercent = getUsagePercentage(catalyst);
                                    const isDepleted = parseFloat(catalyst.remaining_amount) <= 0.0001;

                                    return (
                                        <tr key={catalyst.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    <Link to={`/catalysts/${catalyst.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                                        {catalyst.name}
                                                    </Link>
                                                    {isDepleted && (
                                                        <span style={{
                                                            padding: '0.125rem 0.375rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.625rem',
                                                            fontWeight: 600,
                                                            backgroundColor: 'var(--color-warning)',
                                                            color: 'white'
                                                        }}>
                                                            DEPLETED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {catalyst.method ? (
                                                    <Link to={`/methods/${catalyst.method.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {catalyst.method.descriptive_name}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td>{catalyst.yield_amount}g</td>
                                            <td>
                                                <span style={{ color: isDepleted ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                                    {catalyst.remaining_amount}g
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        height: '6px',
                                                        backgroundColor: 'var(--color-border)',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                        minWidth: '60px'
                                                    }}>
                                                        <div style={{
                                                            width: `${Math.min(usagePercent, 100)}%`,
                                                            height: '100%',
                                                            backgroundColor: usagePercent <= 10 ? 'var(--color-danger)' :
                                                                usagePercent <= 50 ? 'var(--color-warning)' : 'var(--color-success)',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '35px' }}>
                                                        {usagePercent.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {catalyst.storage_location}
                                            </td>
                                            <td>{new Date(catalyst.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <Link to={`/catalysts/${catalyst.id}`}>
                                                        <Button variant="secondary" className="table-action-button">View</Button>
                                                    </Link>
                                                    <Link to={`/catalysts/${catalyst.id}/edit`}>
                                                        <Button variant="secondary" className="table-action-button">Edit</Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        className="table-action-button"
                                                        onClick={() => handleDelete(catalyst)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {sortedData.length} catalyst{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};