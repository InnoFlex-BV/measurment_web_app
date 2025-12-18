/**
 * HomePage - Dashboard with overview statistics and quick links.
 *
 * Phase 1: Users, Chemicals, Methods, Supports, Catalysts
 * Phase 2: Files, Samples, Characterizations, Observations
 * Phase 3: Experiments, Waveforms, Reactors, Analyzers, Contaminants, Carriers, Groups
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useFiles } from '@/hooks/useFiles';
import { useSamples } from '@/hooks/useSamples';
import { useCharacterizations } from '@/hooks/useCharacterizations';
import { useObservations } from '@/hooks/useObservations';
import { useCatalysts } from '@/hooks/useCatalysts';
import { useExperiments } from '@/hooks/useExperiments';
import { useGroups } from '@/hooks/useGroups';
import { useProcessedResults } from '@/hooks/useProcessed';
import { useWaveforms } from '@/hooks/useWaveforms';
import { useReactors } from '@/hooks/useReactors';
import { useAnalyzers } from '@/hooks/useAnalyzers';
import { useContaminants } from '@/hooks/useContaminants';
import { useCarriers } from '@/hooks/useCarriers';
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

interface SectionHeaderProps {
    title: string;
    description?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
        {description && (
            <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {description}
            </p>
        )}
    </div>
);

export const HomePage: React.FC = () => {
    // Phase 1 & 2 data
    const { data: files, isLoading: loadingFiles } = useFiles({});
    const { data: samples, isLoading: loadingSamples } = useSamples({});
    const { data: characterizations, isLoading: loadingChars } = useCharacterizations({});
    const { data: observations, isLoading: loadingObs } = useObservations({});
    const { data: catalysts, isLoading: loadingCatalysts } = useCatalysts({});

    // Phase 3 data
    const { data: experiments, isLoading: loadingExperiments } = useExperiments({});
    const { data: groups, isLoading: loadingGroups } = useGroups({});
    const { data: processedResults, isLoading: loadingProcessed } = useProcessedResults({});
    const { data: waveforms, isLoading: loadingWaveforms } = useWaveforms({});
    const { data: reactors, isLoading: loadingReactors } = useReactors({});
    const { data: analyzers, isLoading: loadingAnalyzers } = useAnalyzers({});
    const { data: contaminants, isLoading: loadingContaminants } = useContaminants({});
    const { data: carriers, isLoading: loadingCarriers } = useCarriers({});

    // Calculate stats
    const availableSamples = samples?.filter(s => !s.is_depleted).length ?? 0;
    const completedExperiments = experiments?.filter(e => e.has_conclusion).length ?? 0;
    const inProgressExperiments = experiments?.filter(e => !e.has_conclusion).length ?? 0;
    const plasmaExperiments = experiments?.filter(e => e.experiment_type === 'plasma').length ?? 0;
    const photocatalysisExperiments = experiments?.filter(e => e.experiment_type === 'photocatalysis').length ?? 0;
    // const completeResults = processedResults?.filter(r => r.is_complete).length ?? 0;

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                    Chemistry Lab Data Management System - Phase 3
                </p>
            </div>

            {/* Experiments Section - Primary Focus */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SectionHeader
                    title="Experiments"
                    description="Track and analyze catalytic experiments"
                />
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <StatCard
                        title="All Experiments"
                        count={experiments?.length}
                        isLoading={loadingExperiments}
                        linkTo="/experiments"
                        color="#ede7f6"
                        icon="🔬"
                    />
                    <StatCard
                        title="Completed"
                        count={completedExperiments}
                        isLoading={loadingExperiments}
                        linkTo="/experiments?status=completed"
                        color="#e8f5e9"
                        icon="✅"
                    />
                    <StatCard
                        title="In Progress"
                        count={inProgressExperiments}
                        isLoading={loadingExperiments}
                        linkTo="/experiments?status=in-progress"
                        color="#fff3e0"
                        icon="⏳"
                    />
                    <StatCard
                        title="Groups"
                        count={groups?.length}
                        isLoading={loadingGroups}
                        linkTo="/groups"
                        color="#e3f2fd"
                        icon="📊"
                    />
                    <StatCard
                        title="Results"
                        count={processedResults?.length}
                        isLoading={loadingProcessed}
                        linkTo="/processed"
                        color="#fce4ec"
                        icon="📈"
                    />
                </div>

                {/* Experiment Type Breakdown */}
                <div
                    className="card"
                    style={{ marginTop: 'var(--spacing-md)' }}
                >
                    <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', fontWeight: 600 }}>
                        Experiments by Type
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-info, #3b82f6)'
                            }} />
                            <span style={{ fontSize: '0.875rem' }}>
                                Plasma: <strong>{plasmaExperiments}</strong>
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-success, #10b981)'
                            }} />
                            <span style={{ fontSize: '0.875rem' }}>
                                Photocatalysis: <strong>{photocatalysisExperiments}</strong>
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-warning, #f59e0b)'
                            }} />
                            <span style={{ fontSize: '0.875rem' }}>
                                Misc: <strong>{(experiments?.length ?? 0) - plasmaExperiments - photocatalysisExperiments}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment & Reference Section */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SectionHeader
                    title="Equipment & Reference Data"
                    description="Infrastructure for running experiments"
                />
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <StatCard
                        title="Waveforms"
                        count={waveforms?.length}
                        isLoading={loadingWaveforms}
                        linkTo="/waveforms"
                        color="#fce4ec"
                        icon="〰️"
                    />
                    <StatCard
                        title="Reactors"
                        count={reactors?.length}
                        isLoading={loadingReactors}
                        linkTo="/reactors"
                        color="#e8eaf6"
                        icon="⚗️"
                    />
                    <StatCard
                        title="Analyzers"
                        count={analyzers?.length}
                        isLoading={loadingAnalyzers}
                        linkTo="/analyzers"
                        color="#e0f2f1"
                        icon="📈"
                    />
                    <StatCard
                        title="Contaminants"
                        count={contaminants?.length}
                        isLoading={loadingContaminants}
                        linkTo="/contaminants"
                        color="#fff8e1"
                        icon="☁️"
                    />
                    <StatCard
                        title="Carriers"
                        count={carriers?.length}
                        isLoading={loadingCarriers}
                        linkTo="/carriers"
                        color="#e1f5fe"
                        icon="💨"
                    />
                </div>
            </div>

            {/* Samples & Catalysts Section */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SectionHeader
                    title="Samples & Materials"
                    description="Catalysts, samples, and characterization data"
                />
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <StatCard
                        title="Catalysts"
                        count={catalysts?.length}
                        isLoading={loadingCatalysts}
                        linkTo="/catalysts"
                        color="#f3e5f5"
                        icon="⚛️"
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
                        title="Available Samples"
                        count={availableSamples}
                        isLoading={loadingSamples}
                        linkTo="/samples?depleted=false"
                        color="#c8e6c9"
                        icon="✓"
                    />
                    <StatCard
                        title="Characterizations"
                        count={characterizations?.length}
                        isLoading={loadingChars}
                        linkTo="/characterizations"
                        color="#e1bee7"
                        icon="📊"
                    />
                </div>
            </div>

            {/* Files & Observations Section */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SectionHeader
                    title="Data & Documentation"
                    description="Files, notes, and observations"
                />
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
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
                        title="Observations"
                        count={observations?.length}
                        isLoading={loadingObs}
                        linkTo="/observations"
                        color="#fff3e0"
                        icon="📝"
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SectionHeader
                    title="Quick Actions"
                    description="Common tasks and workflows"
                />
                <div className="card">
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        <QuickAction
                            title="New Experiment"
                            description="Record a new plasma, photocatalysis, or misc experiment"
                            linkTo="/experiments/new"
                            buttonText="Create"
                        />
                        <QuickAction
                            title="New Sample"
                            description="Prepare a new sample from an existing catalyst"
                            linkTo="/samples/new"
                            buttonText="Create"
                        />
                        <QuickAction
                            title="New Characterization"
                            description="Record analysis results (XRD, BET, TEM, etc.)"
                            linkTo="/characterizations/new"
                            buttonText="Create"
                        />
                        <QuickAction
                            title="Create Experiment Group"
                            description="Organize related experiments for comparison"
                            linkTo="/groups/new"
                            buttonText="Create"
                        />
                        <QuickAction
                            title="Upload File"
                            description="Add raw data, figures, or documentation"
                            linkTo="/files/new"
                            buttonText="Upload"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div>
                <SectionHeader
                    title="System Status"
                    description="Overview of data completeness"
                />
                <div className="card">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                        <div>
                            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                Experiment Completion
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <div style={{
                                    flex: 1,
                                    height: '8px',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: experiments?.length ? `${(completedExperiments / experiments.length) * 100}%` : '0%',
                                        height: '100%',
                                        backgroundColor: 'var(--color-success, #10b981)',
                                        transition: 'width 0.3s',
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {experiments?.length ? Math.round((completedExperiments / experiments.length) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                Sample Availability
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <div style={{
                                    flex: 1,
                                    height: '8px',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: samples?.length ? `${(availableSamples / samples.length) * 100}%` : '0%',
                                        height: '100%',
                                        backgroundColor: 'var(--color-info, #3b82f6)',
                                        transition: 'width 0.3s',
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {samples?.length ? Math.round((availableSamples / samples.length) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
