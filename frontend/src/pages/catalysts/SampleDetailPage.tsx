/**
 * SampleDetailPage - Comprehensive detail view for a single sample.
 *
 * Displays sample information including source catalyst, support material,
 * preparation method, inventory status, and linked characterizations and
 * observations. Provides actions for editing, consuming material, and
 * managing relationships.
 */

import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSample, useDeleteSample, useConsumeSample } from '@/hooks/useSamples';
import { Button, Badge, TextInput } from '@/components/common';
import { format } from 'date-fns';

export const SampleDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const sampleId = id ? parseInt(id) : undefined;

    // Consume material state
    const [showConsumeForm, setShowConsumeForm] = useState(false);
    const [consumeAmount, setConsumeAmount] = useState('');
    const [consumeNotes, setConsumeNotes] = useState('');

    // Fetch sample with all relationships
    const { data: sample, isLoading, error } = useSample(
        sampleId,
        'catalyst,support,method,created_by,characterizations,observations'
    );

    const deleteMutation = useDeleteSample();
    const consumeMutation = useConsumeSample();

    const handleDelete = () => {
        if (!sample) return;
        if (window.confirm(`Are you sure you want to delete sample "${sample.name}"?`)) {
            deleteMutation.mutate(
                { id: sample.id },
                { onSuccess: () => navigate('/samples') }
            );
        }
    };

    const handleConsume = () => {
        if (!sample || !consumeAmount) return;
        consumeMutation.mutate(
            {
                id: sample.id,
                amount: consumeAmount,
                notes: consumeNotes || undefined,
            },
            {
                onSuccess: () => {
                    setShowConsumeForm(false);
                    setConsumeAmount('');
                    setConsumeNotes('');
                },
            }
        );
    };

    /**
     * Calculate usage statistics
     */
    const getUsageStats = () => {
        if (!sample) return { remaining: 0, total: 0, percentage: 0 };
        const total = parseFloat(sample.yield_amount);
        const remaining = parseFloat(sample.remaining_amount);
        const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
        return { remaining, total, percentage };
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading sample...</p>
                </div>
            </div>
        );
    }

    if (error || !sample) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Sample not found or error loading data.</p>
                    <Link to="/samples">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Samples
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const stats = getUsageStats();

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>{sample.name}</h1>
                        {sample.is_depleted ? (
                            <Badge variant="danger">Depleted</Badge>
                        ) : (
                            <Badge variant="success">Available</Badge>
                        )}
                    </div>
                    <p className="page-description">Sample #{sample.id}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to="/samples">
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                    <Link to={`/samples/${sample.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                        Delete
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {/* Basic Information */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Sample Information
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Name
                            </dt>
                            <dd style={{ margin: 0, fontWeight: 500 }}>{sample.name}</dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Storage Location
                            </dt>
                            <dd style={{ margin: 0 }}>{sample.storage_location}</dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Created By
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {sample.created_by ? (
                                    <Link to={`/users/${sample.created_by.id}`} style={{ color: 'var(--color-primary)' }}>
                                        {sample.created_by.full_name || sample.created_by.username}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Unknown</span>
                                )}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Created At
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {format(new Date(sample.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Inventory & Usage */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Inventory Status
                    </h2>

                    {/* Usage Bar */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                            <span>Remaining: {stats.percentage}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    width: `${stats.percentage}%`,
                                    backgroundColor: stats.percentage <= 10 ? 'var(--color-danger)' : stats.percentage <= 70 ? 'var(--color-warning)' : 'var(--color-success)',
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </div>
                    </div>

                    <dl style={{ margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Total Yield
                                </dt>
                                <dd style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, fontFamily: 'monospace' }}>
                                    {parseFloat(sample.yield_amount).toFixed(2)} g
                                </dd>
                            </div>
                            <div>
                                <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Remaining
                                </dt>
                                <dd style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, fontFamily: 'monospace' }}>
                                    {parseFloat(sample.remaining_amount).toFixed(2)} g
                                </dd>
                            </div>
                        </div>
                    </dl>

                    {/* Consume Material */}
                    {!sample.is_depleted && (
                        <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                            {showConsumeForm ? (
                                <div>
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        <label className="form-label">Amount to consume (g)</label>
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={sample.remaining_amount}
                                            value={consumeAmount}
                                            onChange={(e) => setConsumeAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        <label className="form-label">Notes (optional)</label>
                                        <TextInput
                                            type="text"
                                            value={consumeNotes}
                                            onChange={(e) => setConsumeNotes(e.target.value)}
                                            placeholder="Experiment reference, reason, etc."
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <Button
                                            variant="primary"
                                            onClick={handleConsume}
                                            disabled={!consumeAmount || consumeMutation.isPending}
                                        >
                                            {consumeMutation.isPending ? 'Consuming...' : 'Confirm'}
                                        </Button>
                                        <Button variant="secondary" onClick={() => setShowConsumeForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="secondary" onClick={() => setShowConsumeForm(true)}>
                                    Consume Material
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Source Materials */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Source Materials
                    </h2>
                    <dl style={{ margin: 0 }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Source Catalyst
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {sample.catalyst ? (
                                    <Link to={`/catalysts/${sample.catalyst.id}`} style={{ color: 'var(--color-primary)' }}>
                                        {sample.catalyst.name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>None specified</span>
                                )}
                            </dd>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Support Material
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {sample.support ? (
                                    <Link to={`/supports/${sample.support.id}`} style={{ color: 'var(--color-primary)' }}>
                                        {sample.support.descriptive_name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>None specified</span>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Preparation Method
                            </dt>
                            <dd style={{ margin: 0 }}>
                                {sample.method ? (
                                    <Link to={`/methods/${sample.method.id}`} style={{ color: 'var(--color-primary)' }}>
                                        {sample.method.descriptive_name}
                                    </Link>
                                ) : (
                                    <span style={{ color: 'var(--color-text-secondary)' }}>None specified</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Notes Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Notes
                    </h2>
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {sample.notes || 'No notes added for this sample.'}
                    </p>
                </div>
            </div>
            
            {/* Characterizations Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Characterizations ({sample.characterizations?.length || 0})
                    </h2>
                    <Link to={`/characterizations/new?sample_id=${sample.id}`}>
                        <Button variant="secondary" size="sm">Add Characterization</Button>
                    </Link>
                </div>
                {sample.characterizations && sample.characterizations.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {sample.characterizations.map((char) => (
                            <Link
                                key={char.id}
                                to={`/characterizations/${char.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>{char.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <Badge variant="info" size="sm">{char.characterization_type}</Badge>
                                    {char.performed_at && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(char.performed_at), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No characterizations linked to this sample yet.
                    </p>
                )}
            </div>

            {/* Observations Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Observations ({sample.observations?.length || 0})
                    </h2>
                    <Link to={`/observations/new?sample_id=${sample.id}`}>
                        <Button variant="secondary" size="sm">Add Observation</Button>
                    </Link>
                </div>
                {sample.observations && sample.observations.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {sample.observations.map((obs) => (
                            <Link
                                key={obs.id}
                                to={`/observations/${obs.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>{obs.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    {obs.observation_type && (
                                        <Badge variant="neutral" size="sm">{obs.observation_type}</Badge>
                                    )}
                                    {obs.observed_at && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(obs.observed_at), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No observations linked to this sample yet.
                    </p>
                )}
            </div>
        </div>
    );
};