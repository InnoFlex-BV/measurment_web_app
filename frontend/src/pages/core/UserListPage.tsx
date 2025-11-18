/**
 * UserListPage - List view for all users with search and filtering.
 *
 * This component demonstrates the standard pattern for list pages that you'll
 * replicate for every entity type. The pattern includes:
 * - Data fetching with loading and error states
 * - Search and filter controls
 * - Tabular display of entities
 * - Action buttons for viewing, editing, and deleting
 * - Navigation to create new entities
 *
 * The component uses React Query hooks to fetch data, which handles caching
 * and refetching automatically. The UI updates reactively when data changes
 * through mutations, without manual cache management.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import { Button, TextInput } from '@/components/common';
import type { User } from '@/services/api';

export const UserListPage: React.FC = () => {
    // State for search and filter controls
    // These values are passed to the useUsers hook as query parameters
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

    // Fetch users with current search and filter values
    // React Query automatically refetches when search or isActive changes
    // because these values are part of the query key
    const { data: users, isLoading, error } = useUsers({ search, is_active: isActive });

    // Get the delete mutation hook
    // This provides a mutate function to trigger deletion and automatically
    // handles cache invalidation after successful deletion
    const deleteMutation = useDeleteUser();

    /**
     * Handle user deletion with confirmation.
     *
     * This function demonstrates the pattern for delete operations. We show
     * a confirmation dialog to prevent accidental deletions, then call the
     * mutation's mutate function. React Query handles the API call and cache
     * updates automatically. The UI updates reactively when the deletion succeeds.
     */
    const handleDelete = (user: User) => {
        if (window.confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
            deleteMutation.mutate(user.id);
        }
    };

    return (
        <div className="container">
            {/* Page header with title and create button */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-description">Manage research personnel and lab users</p>
                </div>
                <Link to="/users/new">
                    <Button variant="primary">Create User</Button>
                </Link>
            </div>

            {/* Search and filter controls */}
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
                        <select
                            className="select"
                            value={isActive === undefined ? '' : String(isActive)}
                            onChange={(e) => setIsActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <option value="">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="loading-container">
                    <p>Loading users...</p>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading users. Please try again.</p>
                </div>
            )}

            {/* Data table */}
            {users && (
                <>
                    {users.length === 0 ? (
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
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((user) => (
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
                                                    <Button variant="secondary" className="table-action-button">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link to={`/users/${user.id}/edit`}>
                                                    <Button variant="secondary" className="table-action-button">
                                                        Edit
                                                    </Button>
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
                </>
            )}
        </div>
    );
};