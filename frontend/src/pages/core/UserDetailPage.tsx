/**
 * UserDetailPage - Detail view for a single user.
 *
 * This component demonstrates the standard pattern for detail pages that show
 * complete information about a single entity. The page displays all the user's
 * attributes in a readable format and provides action buttons for editing and
 * deleting.
 *
 * For entities with relationships, this is where you'd show related data like
 * "Catalysts this user worked on" or "Experiments this user conducted." The
 * user entity is simple so it doesn't have these relationships yet, but the
 * pattern scales to accommodate them.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUser, useDeleteUser } from '@/hooks/useUsers';
import { Button } from '@/components/common';

export const UserDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const userId = id ? parseInt(id) : undefined;

    const { data: user, isLoading, error } = useUser(userId);
    const deleteMutation = useDeleteUser();

    const handleDelete = () => {
        if (!user) return;

        if (window.confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
            deleteMutation.mutate(user.id, {
                onSuccess: () => {
                    navigate('/users');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading user...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>User not found or error loading user data.</p>
                    <Link to="/users">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Users
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page header with actions */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">{user.full_name}</h1>
                    <p className="page-description">@{user.username}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/users/${user.id}/edit`}>
                        <Button variant="primary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        isLoading={deleteMutation.isPending}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            {/* User details card */}
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label className="form-label">Username</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{user.username}</p>
                    </div>
                    
                    <div>
                        <label className="form-label">Full Name</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{user.full_name}</p>
                    </div>

                    <div>
                        <label className="form-label">Email</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            <a href={`mailto:${user.email}`} style={{ color: 'var(--color-primary)' }}>
                                {user.email}
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Status</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
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
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Created</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(user.created_at).toLocaleString()}
                        </p>
                    </div>
                    
                    <div>
                        <label className="form-label">Updated</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(user.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* TODO: Phase 5 - Add sections showing user's activity history */}
            {/* This would show catalysts, samples, experiments, etc. the user has worked on */}
        </div>
    );
};