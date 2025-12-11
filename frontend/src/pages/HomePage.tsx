/**
 * HomePage - Dashboard with overview statistics and quick links.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useFiles } from '@/hooks/useFiles';
import { useSamples } from '@/hooks/useSamples';
import { useCharacterizations } from '@/hooks/useCharacterizations';
import { useObservations } from '@/hooks/useObservations';
import { Button } from '@/components/common';

interface StatCardProps {
    title: string;
    count: number | undefined;
    isLoading: boolean;
    linkTo: string;
    color: string;
    icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, isLoading, linkTo, color, icon }) => (
    <Link
        to={linkTo}
        style={{
            textDecoration: 'none',
            color: 'inherit',
        }}
    >
        <div
            className="card"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                    {isLoading ? '...' : count ?? 0}
                </p>
            </div>
        </div>
    </Link>
);

interface QuickActionProps {
    title: string;
    description: string;
    linkTo: string;
    buttonText: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, linkTo, buttonText }) => (
    <div
        style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}
    >
        <div>
            <p style={{ margin: 0, fontWeight: 500 }}>{title}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {description}
            </p>
        </div>
        <Link to={linkTo}>
            <Button variant="primary" size="sm">{buttonText}</Button>
        </Link>
    </div>
);

export const HomePage: React.FC = () => {
    // Fetch counts for dashboard
    const { data: files, isLoading: loadingFiles } = useFiles({});
    const { data: samples, isLoading: loadingSamples } = useSamples({});
    const { data: characterizations, isLoading: loadingChars } = useCharacterizations({});
    const { data: observations, isLoading: loadingObs } = useObservations({});

    // Calculate some stats
    const availableSamples = samples?.filter(s => !s.is_depleted).length ?? 0;
    const depletedSamples = samples?.filter(s => s.is_depleted).length ?? 0;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                    Chemistry Lab Data Management System - Phase 2 Preview
                </p>
            </div>

            {/* Stats Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-xl)',
                }}
            >
                <StatCard
                    title="Files"
                    count={files?.length}
                    isLoading={loadingFiles}
                    linkTo="/files"
                    color="#e3f2fd"
                    icon="📁"
                />
                <StatCard
                    title="Samples"
                    count={samples?.length}
                    isLoading={loadingSamples}
                    linkTo="/samples"
                    color="#e8f5e9"
                    icon="🧪"
                />
                <StatCard
                    title="Characterizations"
                    count={characterizations?.length}
                    isLoading={loadingChars}
                    linkTo="/characterizations"
                    color="#fff3e0"
                    icon="📊"
                />
                <StatCard
                    title="Observations"
                    count={observations?.length}
                    isLoading={loadingObs}
                    linkTo="/observations"
                    color="#fce4ec"
                    icon="📝"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Quick Actions */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Quick Actions
                    </h2>
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        <QuickAction
                            title="Upload File"
                            description="Add a new file record to the system"
                            linkTo="/files/new"
                            buttonText="Upload"
                        />
                        <QuickAction
                            title="Create Sample"
                            description="Prepare a new sample from catalyst material"
                            linkTo="/samples/new"
                            buttonText="Create"
                        />
                        <QuickAction
                            title="Add Characterization"
                            description="Record a new analytical measurement"
                            linkTo="/characterizations/new"
                            buttonText="Add"
                        />
                        <QuickAction
                            title="Record Observation"
                            description="Document a qualitative research note"
                            linkTo="/observations/new"
                            buttonText="Record"
                        />
                    </div>
                </div>

                {/* Sample Status */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Sample Inventory
                    </h2>
                    {loadingSamples ? (
                        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
                    ) : (
                        <>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                    <span style={{ fontSize: '0.875rem' }}>Available</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>
                                        {availableSamples}
                                    </span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${samples?.length ? (availableSamples / samples.length) * 100 : 0}%`,
                                            backgroundColor: 'var(--color-success)',
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                    <span style={{ fontSize: '0.875rem' }}>Depleted</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                                        {depletedSamples}
                                    </span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${samples?.length ? (depletedSamples / samples.length) * 100 : 0}%`,
                                            backgroundColor: 'var(--color-danger)',
                                        }}
                                    />
                                </div>
                            </div>
                            <Link to="/samples" style={{ display: 'block', marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                                View all samples →
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Phase 2 Entities Info */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Phase 2 Entities
                </h2>
                <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                    The following entities are implemented in this phase:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>📁 Files</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            File metadata storage with soft-delete support. Tracks uploaded documents, data files, and images.
                        </p>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>🧪 Samples</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Prepared catalyst portions with inventory tracking. Links to source catalysts, supports, and methods.
                        </p>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>📊 Characterizations</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Analytical measurements (XRD, BET, TEM, etc.) with data file attachments. Links to catalysts and samples.
                        </p>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>📝 Observations</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Qualitative research notes with file attachments. Links to catalysts and samples.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
