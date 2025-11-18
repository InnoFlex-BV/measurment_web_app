/**
 * CatalystDetailPage - Comprehensive detail view for a single catalyst.
 *
 * This page demonstrates the culmination of all the patterns we've built—
 * displaying basic attributes, foreign key relationships, self-referential
 * relationships, computed properties, and domain-specific operations. The
 * page structure provides a complete view of everything known about a catalyst,
 * from its physical properties to its position in the derivation chain.
 *
 * The layout uses cards to group related information logically. The basic
 * properties card shows core attributes. The synthesis information card shows
 * the method and input catalysts. The derivation card shows output catalysts
 * created from this one. This logical grouping helps researchers navigate
 * complex information without feeling overwhelmed.
 *
 * Future phases will add more cards for characterizations (Phase 2), experiments
 * (Phase 3), and other relationships. The component structure accommodates this
 * growth naturally by adding new cards as new relationships are implemented.
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCatalyst, useDeleteCatalyst } from '@/hooks/useCatalysts';
import { Button } from '@/components/common';

export const CatalystDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const catalystId = id ? parseInt(id) : undefined;

    /**
     * Fetch catalyst with all relationships included.
     *
     * We include method, input_catalysts, and output_catalysts to show the complete
     * picture of this catalyst's context. The method shows how it was made. The
     * input_catalysts show what it was derived from. The output_catalysts show
     * what was created from it. Together, these relationships tell the story of
     * this catalyst's role in the research process.
     */
    const { data: catalyst, isLoading, error } = useCatalyst(
        catalystId,
        'method,input_catalysts,output_catalysts'
    );

    const deleteMutation = useDeleteCatalyst();

    const handleDelete = () => {
        if (!catalyst) return;

        if (window.confirm(`Are you sure you want to delete catalyst "${catalyst.name}"?`)) {
            deleteMutation.mutate(catalyst.id, {
                onSuccess: () => {
                    navigate('/catalysts');
                },
            });
        }
    };

    /**
     * Calculate derived properties for display.
     *
     * These calculations transform raw data into meaningful insights. The usage
     * percentage shows how much material has been consumed. The depletion status
     * determines whether the catalyst is still usable. These computed values help
     * researchers make inventory decisions without manual calculation.
     */
    const getUsagePercentage = (): number => {
        if (!catalyst) return 0;
        const yieldAmount = parseFloat(catalyst.yield_amount);
        const remaining = parseFloat(catalyst.remaining_amount);
        if (yieldAmount === 0) return 0;
        // const used = yieldAmount - remaining;
        return (remaining / yieldAmount) * 100;
    };

    const isDepleted = catalyst ? parseFloat(catalyst.remaining_amount) <= 0.0001 : false;
    const usagePercent = getUsagePercentage();

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading catalyst...</p>
                </div>
            </div>
        );
    }

    if (error || !catalyst) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Catalyst not found or error loading data.</p>
                    <Link to="/catalysts">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Catalysts
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page header with status indicators and actions */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">{catalyst.name}</h1>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        {isDepleted && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: 'var(--color-warning)',
                                color: 'white'
                            }}>
                DEPLETED
              </span>
                        )}
                        {usagePercent <= 10 && !isDepleted && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: 'var(--color-danger)',
                                color: 'white'
                            }}>
                LOW INVENTORY
              </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/catalysts/${catalyst.id}/edit`}>
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

            {/* Basic properties card */}
            <div className="card">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                    Catalyst Properties
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label className="form-label">Yield Amount</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {catalyst.yield_amount} g
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Remaining Amount</label>
                        <p style={{ fontSize: '0.875rem', color: isDepleted ? 'var(--color-danger)' : 'var(--color-text)', fontWeight: isDepleted ? 600 : 400 }}>
                            {catalyst.remaining_amount} g
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Material Left</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: 'var(--color-border)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min(usagePercent, 100)}%`,
                                    height: '100%',
                                    backgroundColor: usagePercent <= 10 ? 'var(--color-danger)' :
                                        usagePercent <= 50 ? 'var(--color-warning)' :
                                            'var(--color-success)',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '45px' }}>
                {usagePercent.toFixed(1)}%
              </span>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Storage Location</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {catalyst.storage_location}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Created</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(catalyst.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">Last Updated</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {new Date(catalyst.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {catalyst.notes && (
                    <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
                        <label className="form-label">Notes</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {catalyst.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Synthesis information card */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                    Synthesis Information
                </h3>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label className="form-label">Synthesis Method</label>
                    {catalyst.method ? (
                        <Link
                            to={`/methods/${catalyst.method.id}`}
                            style={{
                                display: 'inline-block',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: 'var(--color-text)',
                                fontSize: '0.875rem',
                                border: '1px solid var(--color-border)',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                e.currentTarget.style.color = 'var(--color-text)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            {catalyst.method.descriptive_name}
                        </Link>
                    ) : (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            No method specified
                        </p>
                    )}
                </div>

                <div>
                    <label className="form-label">Input Catalysts</label>
                    {catalyst.input_catalysts && catalyst.input_catalysts.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 'var(--spacing-sm)'
                        }}>
                            {catalyst.input_catalysts.map(inputCat => (
                                <Link
                                    key={inputCat.id}
                                    to={`/catalysts/${inputCat.id}`}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textDecoration: 'none',
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem',
                                        border: '1px solid var(--color-border)',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                        e.currentTarget.style.color = 'var(--color-text)';
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                    }}
                                >
                                    {inputCat.name}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            No input catalysts (primary synthesis)
                        </p>
                    )}
                </div>
            </div>

            {/* Derivation card - showing what was created from this catalyst */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                    Derived Catalysts
                </h3>

                <label className="form-label">Output Catalysts</label>
                {catalyst.output_catalysts && catalyst.output_catalysts.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {catalyst.output_catalysts.map(outputCat => (
                            <Link
                                key={outputCat.id}
                                to={`/catalysts/${outputCat.id}`}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: 'var(--color-text)',
                                    fontSize: '0.875rem',
                                    border: '1px solid var(--color-border)',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                    e.currentTarget.style.color = 'var(--color-text)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                }}
                            >
                                {outputCat.name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        No catalysts have been derived from this one yet.
                    </p>
                )}
            </div>

            {/* TODO: Phase 2 - Add sections for samples, characterizations, and observations */}
            {/* TODO: Phase 3 - Add section for experiments using this catalyst */}
        </div>
    );
};