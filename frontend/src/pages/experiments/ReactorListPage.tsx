/**
 * ReactorListPage - List view for all reactors.
 *
 * Reactors are the vessels where catalytic reactions and plasma experiments
 * are conducted. Each reactor has specific characteristics that affect
 * experimental results.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReactors, useDeleteReactor } from '@/hooks/useReactors';
import { Button, TextInput, Badge } from '@/components/common';
import type { Reactor } from '@/services/api';
import { format } from 'date-fns';

export const ReactorListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: reactors, isLoading, error } = useReactors({
        search: search || undefined,
        include: 'experiments',
    });
    const deleteMutation = useDeleteReactor();

    const handleDelete = (reactor: Reactor) => {
        if (window.confirm(`Are you sure you want to delete this reactor?`)) {
            deleteMutation.mutate({ id: reactor.id });
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Reactors</h1>
                    <p className="page-description">Reactor vessels for experiments</p>
                </div>
                <Link to="/reactors/new">
                    <Button variant="primary">Add Reactor</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by reactor name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading reactors...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading reactors. Please try again.</p>
                </div>
            )}

            {reactors && (
                <>
                    {reactors.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No reactors found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search terms.'
                                    : 'Get started by adding your first reactor.'}
                            </p>
                            {!search && (
                                <Link to="/reactors/new">
                                    <Button variant="primary">Add First Reactor</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Volume</th>
                                    <th>Experiments</th>
                                    <th>Created</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reactors.map((reactor) => (
                                    <tr key={reactor.id}>
                                        <td>
                                            <Link
                                                to={`/reactors/${reactor.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {reactor.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {reactor.description
                                                ? (reactor.description.length > 40
                                                    ? reactor.description.substring(0, 40) + '...'
                                                    : reactor.description)
                                                : '-'}
                                        </td>
                                        <td>
                                            {reactor.volume
                                                ? `${parseFloat(reactor.volume).toFixed(2)} mL`
                                                : '-'}
                                        </td>
                                        <td>
                                            <Badge variant={reactor.is_in_use ? 'success' : 'neutral'}>
                                                {reactor.experiment_count || reactor.experiments?.length || 0}
                                            </Badge>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(reactor.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/reactors/${reactor.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(reactor)}
                                                    disabled={deleteMutation.isPending || reactor.is_in_use}
                                                    title={reactor.is_in_use ? 'Cannot delete reactor in use' : ''}
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
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {reactors.length} reactor{reactors.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};