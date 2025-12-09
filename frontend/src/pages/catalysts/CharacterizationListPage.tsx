/**
 * CharacterizationListPage - List view for all characterizations.
 *
 * Displays characterization records with filtering by type, performer,
 * and search. Each characterization type (XRD, BET, TEM, etc.) represents
 * a different analytical measurement technique.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharacterizations, useDeleteCharacterization } from '@/hooks/useCharacterizations';
import { useUsers } from '@/hooks/useUsers';
import { Button, TextInput, Select, Badge } from '@/components/common';
import {
    type Characterization,
    type CharacterizationType,
    CHARACTERIZATION_TYPE_LABELS,
} from '@/services/api';
import { format } from 'date-fns';

/**
 * All available characterization types for the filter dropdown
 */
const CHARACTERIZATION_TYPES: CharacterizationType[] = [
    'XRD', 'BET', 'TEM', 'SEM', 'FTIR', 'XPS', 'TPR', 'TGA',
    'UV_VIS', 'RAMAN', 'ICP_OES', 'CHNS', 'NMR', 'GC', 'HPLC', 'MS', 'OTHER',
];

/**
 * Get badge color based on characterization type category
 */
function getTypeBadgeVariant(type: CharacterizationType): 'info' | 'success' | 'warning' | 'neutral' {
    // Imaging techniques
    if (['TEM', 'SEM'].includes(type)) return 'info';
    // Surface analysis
    if (['BET', 'XPS', 'TPR'].includes(type)) return 'success';
    // Spectroscopy
    if (['XRD', 'FTIR', 'UV_VIS', 'RAMAN', 'NMR'].includes(type)) return 'warning';
    return 'neutral';
}

export const CharacterizationListPage: React.FC = () => {
    // Filter state
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<CharacterizationType | ''>('');
    const [performedBy, setPerformedBy] = useState<number | undefined>(undefined);

    // Data fetching
    const { data: characterizations, isLoading, error } = useCharacterizations({
        search: search || undefined,
        characterization_type: typeFilter || undefined,
        performed_by: performedBy,
        include: 'performed_by,catalysts,samples',
    });

    const { data: users } = useUsers({ is_active: true });
    const deleteMutation = useDeleteCharacterization();

    const handleDelete = (char: Characterization) => {
        if (window.confirm(`Are you sure you want to delete characterization "${char.name}"?`)) {
            deleteMutation.mutate(char.id);
        }
    };

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Characterizations</h1>
                    <p className="page-description">Analytical measurements and material analysis results</p>
                </div>
                <Link to="/characterizations/new">
                    <Button variant="primary">Add Characterization</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <TextInput
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as CharacterizationType | '')}
                        >
                            <option value="">All Types</option>
                            {CHARACTERIZATION_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {CHARACTERIZATION_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="form-label">Performed By</label>
                        <Select
                            value={performedBy ?? ''}
                            onChange={(e) => setPerformedBy(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            <option value="">All Users</option>
                            {users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.username}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-container">
                    <p>Loading characterizations...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading characterizations. Please try again.</p>
                </div>
            )}

            {/* Characterizations Table */}
            {characterizations && (
                <>
                    {characterizations.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No characterizations found. {search && 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Performed By</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Links</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {characterizations.map((char) => (
                                        <tr key={char.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <Link
                                                    to={`/characterizations/${char.id}`}
                                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    {char.name}
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <Badge variant={getTypeBadgeVariant(char.characterization_type)} size="sm">
                                                    {char.characterization_type}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {char.performed_by ? (
                                                    <Link to={`/users/${char.performed_by.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                        {char.performed_by.full_name || char.performed_by.username}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {char.performed_at ? format(new Date(char.performed_at), 'MMM d, yyyy') : '—'}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                    {char.catalysts && char.catalysts.length > 0 && (
                                                        <Badge variant="neutral" size="sm">
                                                            {char.catalysts.length} catalyst{char.catalysts.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {char.samples && char.samples.length > 0 && (
                                                        <Badge variant="neutral" size="sm">
                                                            {char.samples.length} sample{char.samples.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {(!char.catalysts || char.catalysts.length === 0) && (!char.samples || char.samples.length === 0) && (
                                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No links</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                    <Link to={`/characterizations/${char.id}`}>
                                                        <Button variant="secondary" size="sm">View</Button>
                                                    </Link>
                                                    <Link to={`/characterizations/${char.id}/edit`}>
                                                        <Button variant="secondary" size="sm">Edit</Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(char)}
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
                        </div>
                    )}

                    <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Showing {characterizations.length} characterization{characterizations.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};