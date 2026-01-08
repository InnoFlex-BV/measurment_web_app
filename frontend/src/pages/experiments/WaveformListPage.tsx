/**
 * WaveformListPage - List view for all waveforms.
 *
 * Waveforms define electrical signal parameters used in plasma experiments.
 * They capture AC and pulsing characteristics that control plasma discharge.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWaveforms, useDeleteWaveform } from '@/hooks/useWaveforms';
import { useSortableData } from '@/hooks';
import { Button, TextInput, SortableHeader } from '@/components/common';
import type { Waveform } from '@/services/api';
import { format } from 'date-fns';

export const WaveformListPage: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: waveforms, isLoading, error } = useWaveforms({ search: search || undefined });
    const { sortedData, requestSort, getSortDirection } = useSortableData(waveforms, { key: 'name', direction: 'asc' });
    const deleteMutation = useDeleteWaveform();

    const handleDelete = (waveform: Waveform) => {
        if (window.confirm(`Are you sure you want to delete waveform "${waveform.name}"?`)) {
            deleteMutation.mutate({ id: waveform.id });
        }
    };

    /**
     * Format frequency for display
     */
    const formatFrequency = (freq?: string): string => {
        if (!freq) return '-';
        const val = parseFloat(freq);
        if (val >= 1000) return `${(val / 1000).toFixed(1)} kHz`;
        return `${val} Hz`;
    };

    /**
     * Format duty cycle for display
     */
    const formatDutyCycle = (dc?: string): string => {
        if (!dc) return '-';
        return `${parseFloat(dc).toFixed(1)}%`;
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Waveforms</h1>
                    <p className="page-description">Electrical signal configurations for plasma experiments</p>
                </div>
                <Link to="/waveforms/new">
                    <Button variant="primary">Add Waveform</Button>
                </Link>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Search</label>
                <TextInput
                    type="text"
                    placeholder="Search by waveform name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="loading-container">
                    <p>Loading waveforms...</p>
                </div>
            )}

            {error && (
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--spacing-md)' }}>
                    <p>Error loading waveforms. Please try again.</p>
                </div>
            )}

            {waveforms && (
                <>
                    {sortedData.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No waveforms found</h3>
                            <p className="empty-state-description">
                                {search
                                    ? 'Try adjusting your search terms.'
                                    : 'Get started by adding your first waveform configuration.'}
                            </p>
                            {!search && (
                                <Link to="/waveforms/new">
                                    <Button variant="primary">Add First Waveform</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <table className="table">
                                <thead>
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" currentDirection={getSortDirection('name')} onSort={requestSort} />
                                    <SortableHeader label="AC Frequency" sortKey="ac_frequency" currentDirection={getSortDirection('ac_frequency')} onSort={requestSort} />
                                    <SortableHeader label="AC Duty Cycle" sortKey="ac_duty_cycle" currentDirection={getSortDirection('ac_duty_cycle')} onSort={requestSort} />
                                    <SortableHeader label="Pulsing Freq" sortKey="pulsing_frequency" currentDirection={getSortDirection('pulsing_frequency')} onSort={requestSort} />
                                    <SortableHeader label="Pulsing Duty" sortKey="pulsing_duty_cycle" currentDirection={getSortDirection('pulsing_duty_cycle')} onSort={requestSort} />
                                    <SortableHeader label="Created" sortKey="created_at" currentDirection={getSortDirection('created_at')} onSort={requestSort} />
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', width: '150px' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedData.map((waveform) => (
                                    <tr key={waveform.id}>
                                        <td>
                                            <Link
                                                to={`/waveforms/${waveform.id}`}
                                                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
                                            >
                                                {waveform.name}
                                            </Link>
                                        </td>
                                        <td>{formatFrequency(waveform.ac_frequency)}</td>
                                        <td>{formatDutyCycle(waveform.ac_duty_cycle)}</td>
                                        <td>{formatFrequency(waveform.pulsing_frequency)}</td>
                                        <td>{formatDutyCycle(waveform.pulsing_duty_cycle)}</td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(waveform.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <Link to={`/waveforms/${waveform.id}/edit`}>
                                                    <Button variant="secondary" size="sm">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(waveform)}
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
                        {sortedData.length} waveform{sortedData.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};