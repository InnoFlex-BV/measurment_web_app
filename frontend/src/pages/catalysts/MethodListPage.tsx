/**
 * MethodListPage - List view for all synthesis methods.
 *
 * Methods represent the procedures used to create catalysts. This page follows
 * the established list pattern but adds an active status filter, which is
 * important because methods can be retired when better procedures are developed
 * while still preserving them for historical catalysts that used them.
 *
 * The active filter helps researchers focus on current best practices while
 * maintaining a complete historical record of all methods ever used.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMethods, useDeleteMethod } from '@/hooks/useMethods';
import { useSortableData } from '@/hooks';
import { Button, TextInput, Select, SortableHeader } from '@/components/common';
import type { Method } from '@/services/api';

export const MethodListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

    const { data: methods, isLoading, error } = useMethods({ search, is_active: isActive });
    const { sortedData, requestSort, getSortDirection } = useSortableData(methods, { key: 'descriptive_name', direction: 'asc' });
    const deleteMutation = useDeleteMethod();

    const handleDelete = (method: Method) => {
        if (window.confirm(`Are you sure you want to delete method "${method.descriptive_name}"?`)) {
            deleteMutation.mutate(method.id);
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Methods</h1>
                    <p className="page-description">Manage synthesis procedures for catalyst preparation</p>
                </div>
                <Link to="/methods/new">
                    <Button variant="primary">Create Method</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-md)', alignItems: 'end' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by method name or procedure text..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <Select
                            value={isActive === undefined ? '' : String(isActive)}
                            onChange={(e) => setIsActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <option value="">All Methods</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading methods...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading methods. Please try again.</p>
                </div>
            )}

            {methods && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No methods found</h3>
                            <p className="empty-state-description">
                                {search || isActive !== undefined
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first synthesis method'}
                            </p>
                            <Link to="/methods/new">
                                <Button variant="primary">Create Method</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Method Name" sortKey="descriptive_name" currentDirection={getSortDirection('descriptive_name')} onSort={requestSort} />
                                    <SortableHeader label="Procedure Summary" sortKey="procedure" currentDirection={getSortDirection('procedure')} onSort={requestSort} />
                                    <SortableHeader label="Status" sortKey="is_active" currentDirection={getSortDirection('is_active')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((method) => (
                                    <tr key={method.id}>
                                        <td>{method.descriptive_name}</td>
                                        <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {method.procedure}
                                        </td>
                                        <td>
                        <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: method.is_active ? 'var(--color-success)' : 'var(--color-secondary)',
                            color: 'white'
                        }}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                                        </td>
                                        <td>{new Date(method.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Link to={`/methods/${method.id}`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link to={`/methods/${method.id}/edit`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    className="table-action-button"
                                                    onClick={() => handleDelete(method)}
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