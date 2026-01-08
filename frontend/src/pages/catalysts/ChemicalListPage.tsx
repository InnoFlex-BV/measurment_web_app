/**
 * ChemicalListPage - List view for all chemicals.
 *
 * This page follows the exact same pattern as UserListPage but demonstrates
 * how the pattern simplifies when entities have fewer fields. Chemicals only
 * have a name, so the search is simpler and the table has fewer columns.
 *
 * Notice how the overall structure remains identical to UserListPage:
 * - Page header with title and create button
 * - Search controls in a card
 * - Loading, error, and empty states
 * - Data table with action buttons
 *
 * This consistency means once you understand one entity's list page, you
 * understand them all. The pattern becomes muscle memory.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChemicals, useDeleteChemical } from '@/hooks/useChemicals';
import { useSortableData } from '@/hooks';
import { Button, TextInput, SortableHeader } from '@/components/common';
import type { Chemical } from '@/services/api';

export const ChemicalListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: chemicals, isLoading, error } = useChemicals({ search });
    const { sortedData, requestSort, getSortDirection } = useSortableData(chemicals, { key: 'name', direction: 'asc' });
    const deleteMutation = useDeleteChemical();

    const handleDelete = (chemical: Chemical) => {
        if (window.confirm(`Are you sure you want to delete chemical "${chemical.name}"?`)) {
            deleteMutation.mutate(chemical.id);
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Chemicals</h1>
                    <p className="page-description">Manage chemical compounds used in catalyst synthesis</p>
                </div>
                <Link to="/chemicals/new">
                    <Button variant="primary">Add Chemical</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by chemical name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading chemicals...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading chemicals. Please try again.</p>
                </div>
            )}

            {chemicals && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No chemicals found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search'
                                    : 'Get started by adding your first chemical compound'}
                            </p>
                            <Link to="/chemicals/new">
                                <Button variant="primary">Add Chemical</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((chemical) => (
                                    <tr key={chemical.id}>
                                        <td>{chemical.name}</td>
                                        <td>{new Date(chemical.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Link to={`/chemicals/${chemical.id}`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link to={`/chemicals/${chemical.id}/edit`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    className="table-action-button"
                                                    onClick={() => handleDelete(chemical)}
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
                </>
            )}
        </div>
    );
};