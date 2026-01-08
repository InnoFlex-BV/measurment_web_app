/**
 * UserListPage - List view for all users with search, filtering, and sorting.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUsers, useDeleteUser, useSortableData } from '@/hooks';
import { Button, TextInput, Select, SortableHeader } from '@/components/common';
import type { User } from '@/services/api';

export const UserListPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

    const { data: users, isLoading, error } = useUsers({ search, is_active: isActive });
    const { sortedData, requestSort, getSortDirection } = useSortableData(users, { key: 'full_name', direction: 'asc' });

    const deleteMutation = useDeleteUser();

    const handleDelete = (user: User) => {
        if (window.confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
            deleteMutation.mutate(user.id);
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-description">Manage research personnel and lab users</p>
                </div>
                <Link to="/users/new">
                    <Button variant="primary">Create User</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-md)', alignItems: 'end' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by username, name, or email..."
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
                            <option value="">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading users...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading users. Please try again.</p>
                </div>
            )}

            {users && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No users found</h3>
                            <p className="empty-state-description">
                                {search || isActive !== undefined
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first user'}
                            </p>
                            <Link to="/users/new">
                                <Button variant="primary">Create User</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Username" sortKey="username" currentDirection={getSortDirection('username')} onSort={requestSort} />
                                    <SortableHeader label="Full Name" sortKey="full_name" currentDirection={getSortDirection('full_name')} onSort={requestSort} />
                                    <SortableHeader label="Email" sortKey="email" currentDirection={getSortDirection('email')} onSort={requestSort} />
                                    <SortableHeader label="Status" sortKey="is_active" currentDirection={getSortDirection('is_active')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.full_name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                backgroundColor: user.is_active ? 'var(--color-success)' : 'var(--color-secondary)',
                                                color: 'white'
                                            }}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Link to={`/users/${user.id}`}>
                                                    <Button variant="secondary" className="table-action-button">View</Button>
                                                </Link>
                                                <Link to={`/users/${user.id}/edit`}>
                                                    <Button variant="secondary" className="table-action-button">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    className="table-action-button"
                                                    onClick={() => handleDelete(user)}
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

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {sortedData.length} user{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};