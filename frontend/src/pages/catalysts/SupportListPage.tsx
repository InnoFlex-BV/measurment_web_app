/**
 * SupportListPage - List view for all supports.
 *
 * This page is nearly identical to ChemicalListPage, demonstrating how
 * entities with similar complexity result in similar UI implementations.
 * The only difference is terminology—we're displaying supports instead
 * of chemicals, but the structure is the same.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupports, useDeleteSupport } from '@/hooks/useSupports';
import { useSortableData } from '@/hooks';
import { Button, TextInput, SortableHeader } from '@/components/common';
import type { Support } from '@/services/api';

export const SupportListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: supports, isLoading, error } = useSupports({ search });
    const { sortedData, requestSort, getSortDirection } = useSortableData(supports, { key: 'descriptive_name', direction: 'asc' });
    const deleteMutation = useDeleteSupport();

    const handleDelete = (support: Support) => {
        if (window.confirm(`Are you sure you want to delete support "${support.descriptive_name}"?`)) {
            deleteMutation.mutate(support.id);
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Supports</h1>
                    <p className="page-description">Manage substrate materials for catalyst applications</p>
                </div>
                <Link to="/supports/new">
                    <Button variant="primary">Add Support</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by support name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading supports...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading supports. Please try again.</p>
                </div>
            )}

            {supports && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No supports found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search'
                                    : 'Get started by adding your first support material'}
                            </p>
                            <Link to="/supports/new">
                                <Button variant="primary">Add Support</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Name" sortKey="descriptive_name" currentDirection={getSortDirection('descriptive_name')} onSort={requestSort} />
                                    <SortableHeader label="Description" sortKey="description" currentDirection={getSortDirection('description')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((support) => (
                                    <tr key={support.id}>
                                        <td>{support.descriptive_name}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {support.description || '—'}
                                        </td>
                                        <td>{new Date(support.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Link to={`/supports/${support.id}`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link to={`/supports/${support.id}/edit`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    className="table-action-button"
                                                    onClick={() => handleDelete(support)}
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