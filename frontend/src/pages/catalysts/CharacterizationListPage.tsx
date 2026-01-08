/**
 * CharacterizationListPage - List view for all characterizations.
 *
 * Displays characterization records with filtering by type and search.
 * Each characterization type (XRD, BET, TEM, etc.) represents
 * a different analytical measurement technique.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharacterizations, useDeleteCharacterization } from '@/hooks/useCharacterizations';
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
function getTypeBadgeVariant(type: string): 'info' | 'success' | 'warning' | 'neutral' {
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

    // Data fetching
    const { data: characterizations, isLoading, error } = useCharacterizations({
        search: search || undefined,
        type_name: typeFilter || undefined,
        include: 'users,catalysts,samples',
    });

    const deleteMutation = useDeleteCharacterization();

    const handleDelete = (char: Characterization) => {
        const typeLabel = CHARACTERIZATION_TYPE_LABELS[char.type_name as CharacterizationType] || char.type_name;
        if (window.confirm(`Are you sure you want to delete this ${typeLabel} characterization (#${char.id})?`)) {
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
                            placeholder="Search by description..."
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
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Researchers</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>Created</th>
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
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <Badge variant={getTypeBadgeVariant(char.type_name)} size="sm">
                                                        {char.type_name}
                                                    </Badge>
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', maxWidth: '300px' }}>
                                                <Link
                                                    to={`/characterizations/${char.id}`}
                                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    {char.description ? (
                                                        <span style={{
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {char.description}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                                            {CHARACTERIZATION_TYPE_LABELS[char.type_name as CharacterizationType] || char.type_name} #{char.id}
                                                        </span>
                                                    )}
                                                </Link>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                                {char.users && char.users.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                        {char.users.slice(0, 2).map((user) => (
                                                            <Link
                                                                key={user.id}
                                                                to={`/users/${user.id}`}
                                                                style={{
                                                                    color: 'var(--color-primary)',
                                                                    textDecoration: 'none',
                                                                    fontSize: '0.875rem',
                                                                }}
                                                            >
                                                                {user.full_name || user.username}
                                                            </Link>
                                                        ))}
                                                        {char.users.length > 2 && (
                                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                                +{char.users.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {format(new Date(char.created_at), 'MMM d, yyyy')}
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