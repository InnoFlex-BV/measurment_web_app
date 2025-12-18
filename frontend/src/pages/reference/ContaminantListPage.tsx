/**
 * ContaminantListPage - List view for all contaminants.
 *
 * Contaminants are the target compounds that experiments aim to remove
 * or decompose (e.g., toluene, formaldehyde, NOx).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContaminants, useDeleteContaminant } from '@/hooks/useContaminants.ts';
import { Button, TextInput } from '@/components/common';
import type { Contaminant } from '@/services/api';
import { format } from 'date-fns';

export const ContaminantListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: contaminants, isLoading, error } = useContaminants({ search: search || undefined });
    const deleteMutation = useDeleteContaminant();

    const handleDelete = (contaminant: Contaminant) => {
        if (window.confirm(`Are you sure you want to delete contaminant "${contaminant.name}"?`)) {
            deleteMutation.mutate({ id: contaminant.id });
        }
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Contaminants</h1>
                    <p className="page-description">Target compounds for decomposition experiments</p>
                </div>
                <Link to="/contaminants/new">
                    <Button variant="primary">Add Contaminant</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by contaminant name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading contaminants...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading contaminants. Please try again.</p>
                </div>
            )}

            {contaminants && (
                <>
                    {contaminants.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No contaminants found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search terms.'
                                    : 'Get started by adding your first contaminant.'}
                            </p>
                            {!search && (
                                <Link to="/contaminants/new">
                                    <Button variant="primary">Add First Contaminant</Button>
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
                                {contaminants.map((contaminant) => (
                                    <tr key={contaminant.id}>
                                        <td>
                                            <Link
                                                to={`/contaminants/${contaminant.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {contaminant.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(contaminant.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/contaminants/${contaminant.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(contaminant)}
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
                        {contaminants.length} contaminant{contaminants.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};