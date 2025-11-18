/**
 * CatalystListPage - List view for all catalysts with advanced filtering.
 *
 * Catalysts are the central research artifacts in this system, so the list page
 * needs sophisticated filtering to help researchers find what they're looking for.
 * Users might want to find "all depleted platinum catalysts created using sol-gel
 * methods" which requires combining multiple filters.
 *
 * The filtering pattern established here—independent filters that combine through
 * query parameters—scales well because each filter is self-contained. Adding new
 * filters means adding new state variables and passing them to the query hook.
 * The backend handles the actual filtering logic, so the frontend just needs to
 * collect user preferences and pass them along.
 *
 * This page also introduces the pattern of displaying computed properties like
 * depletion status that come from business logic in the models. The backend
 * calculates whether a catalyst is depleted, and the frontend displays that
 * information visually through badges and icons.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalysts, useDeleteCatalyst } from '@/hooks/useCatalysts';
import { useMethods } from '@/hooks/useMethods';
import { Button, TextInput } from '@/components/common';
import type { Catalyst } from '@/services/api';

export const CatalystListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [methodId, setMethodId] = useState<number | undefined>(undefined);
    const [depleted, setDepleted] = useState<boolean | undefined>(undefined);

    /**
     * Fetch catalysts with current filter values.
     *
     * React Query automatically creates a new query key when filter values change,
     * which triggers a refetch with the new parameters. This means the table updates
     * immediately when users adjust filters without any manual refresh logic needed.
     *
     * We include the method relationship in the query so we can display method names
     * in the table without additional queries. This is an example of eager loading—
     * fetching related data upfront when you know you'll need it.
     */
    const { data: catalysts, isLoading, error } = useCatalysts({
        search,
        method_id: methodId,
        depleted,
        include: 'method'
    });

    /**
     * Fetch methods for the filter dropdown.
     *
     * We only fetch active methods because researchers typically filter by methods
     * they're currently using, not historical deprecated ones. This keeps the
     * dropdown focused and relevant.
     */
    const { data: methods } = useMethods({ is_active: true });

    const deleteMutation = useDeleteCatalyst();

    const handleDelete = (catalyst: Catalyst) => {
        if (window.confirm(`Are you sure you want to delete catalyst "${catalyst.name}"?`)) {
            deleteMutation.mutate(catalyst.id);
        }
    };

    /**
     * Helper to calculate and format the usage percentage.
     *
     * This function demonstrates handling decimal values that come from the backend
     * as strings. JavaScript's parseFloat converts the string to a number so we can
     * do arithmetic, then we format the result as a percentage with one decimal place.
     *
     * The calculation shows how much of the original yield has been consumed, giving
     * researchers a quick visual indicator of catalyst inventory status.
     */
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

            {/* Advanced filter controls */}
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
                        <select
                            className="select"
                            value={methodId || ''}
                            onChange={(e) => setMethodId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Methods</option>
                            {methods?.map(method => (
                                <option key={method.id} value={method.id}>
                                    {method.descriptive_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Inventory Status</label>
                        <select
                            className="select"
                            value={depleted === undefined ? '' : String(depleted)}
                            onChange={(e) => setDepleted(e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <option value="">All Catalysts</option>
                            <option value="false">Available</option>
                            <option value="true">Depleted</option>
                        </select>
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
                    {catalysts.length === 0 ? (
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
                                    <th>Name</th>
                                    <th>Method</th>
                                    <th>Yield</th>
                                    <th>Remaining</th>
                                    <th>Usage</th>
                                    <th>Storage</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {catalysts.map((catalyst) => {
                                    const usagePercent = getUsagePercentage(catalyst);
                                    const isDepleted = parseFloat(catalyst.remaining_amount) <= 0.0001;

                                    return (
                                        <tr key={catalyst.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    {catalyst.name}
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
                                                    <Link
                                                        to={`/methods/${catalyst.method.id}`}
                                                        style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                                                    >
                                                        {catalyst.method.descriptive_name}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td>{catalyst.yield_amount}g</td>
                                            <td>
                          <span style={{
                              color: isDepleted ? 'var(--color-danger)' : 'var(--color-text)'
                          }}>
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
                                                                usagePercent <= 50 ? 'var(--color-warning)' :
                                                                    'var(--color-success)',
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
                                                        <Button variant="secondary" className="table-action-button">
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link to={`/catalysts/${catalyst.id}/edit`}>
                                                        <Button variant="secondary" className="table-action-button">
                                                            Edit
                                                        </Button>
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
                </>
            )}
        </div>
    );
};