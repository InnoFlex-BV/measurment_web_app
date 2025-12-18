/**
 * CarrierListPage - List view for all carrier gases.
 *
 * Carriers are the gases used as the main flow in experiments,
 * carrying the contaminants through the reactor (e.g., N2, Ar, Air).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarriers, useDeleteCarrier } from '@/hooks/useCarriers.ts';
import { Button, TextInput } from '@/components/common';
import type { Carrier } from '@/services/api';
import { format } from 'date-fns';

export const CarrierListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: carriers, isLoading, error } = useCarriers({ search: search || undefined });
    const deleteMutation = useDeleteCarrier();

    const handleDelete = (carrier: Carrier) => {
        if (window.confirm(`Are you sure you want to delete carrier "${carrier.name}"?`)) {
            deleteMutation.mutate({ id: carrier.id });
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Carriers</h1>
                    <p className="page-description">Carrier gases used in experiments</p>
                </div>
                <Link to="/carriers/new">
                    <Button variant="primary">Add Carrier</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by carrier name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading carriers...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading carriers. Please try again.</p>
                </div>
            )}

            {carriers && (
                <>
                    {carriers.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No carriers found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search terms.'
                                    : 'Get started by adding your first carrier gas.'}
                            </p>
                            {!search && (
                                <Link to="/carriers/new">
                                    <Button variant="primary">Add First Carrier</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Created</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {carriers.map((carrier) => (
                                    <tr key={carrier.id}>
                                        <td>
                                            <Link
                                                to={`/carriers/${carrier.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {carrier.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(carrier.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/carriers/${carrier.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(carrier)}
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
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {carriers.length} carrier{carriers.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};