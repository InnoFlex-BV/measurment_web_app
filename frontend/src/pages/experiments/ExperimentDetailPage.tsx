/**
 * ExperimentDetailPage - Comprehensive detail view for a single experiment.
 *
 * Displays type-specific fields for Plasma, Photocatalysis, and Misc experiments,
 * along with all relationships (samples, contaminants, carriers, groups, users).
 */

import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useExperiment, useDeleteExperiment } from '@/hooks/useExperiments';
import { Button, Badge } from '@/components/common';
import {
    EXPERIMENT_TYPE_LABELS,
    ANALYZER_TYPE_LABELS,
    type ExperimentType,
    type AnalyzerType,
    isPlasmaExperiment,
    isPhotocatalysisExperiment,
    isMiscExperiment,
} from '@/services/api';
import { format } from 'date-fns';

/**
 * Get badge color based on experiment type
 */
function getTypeBadgeVariant(type: ExperimentType): 'info' | 'success' | 'warning' {
    switch (type) {
        case 'plasma': return 'info';
        case 'photocatalysis': return 'success';
        case 'misc': return 'warning';
    }
}

export const ExperimentDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const experimentId = id ? parseInt(id) : undefined;

    const { data: experiment, isLoading, error } = useExperiment(
        experimentId,
        'reactor,analyzer,samples,contaminants,carriers,groups,users,raw_data_file,figures_file,discussed_in_file'
    );
    const deleteMutation = useDeleteExperiment();

    const handleDelete = () => {
        if (!experiment) return;

        if (window.confirm(`Are you sure you want to delete experiment "${experiment.name}"?`)) {
            deleteMutation.mutate(experiment.id, {
                onSuccess: () => {
                    navigate('/experiments');
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading experiment...</p>
                </div>
            </div>
        );
    }

    if (error || !experiment) {
        return (
            <div className="container">
                <div className="card" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
                    <p>Experiment not found or error loading data.</p>
                    <Link to="/experiments">
                        <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Back to Experiments
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Link
                        to="/experiments"
                        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                        ← Back to Experiments
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>
                            {experiment.name}
                        </h1>
                        <Badge variant={getTypeBadgeVariant(experiment.experiment_type)}>
                            {EXPERIMENT_TYPE_LABELS[experiment.experiment_type]}
                        </Badge>
                        <Badge variant={experiment.has_conclusion ? 'success' : 'warning'}>
                            {experiment.has_conclusion ? 'Completed' : 'In Progress'}
                        </Badge>
                    </div>
                    <p className="page-description">{experiment.purpose}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/experiments/${experiment.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Type-Specific Parameters */}
            {isPlasmaExperiment(experiment) && (
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Plasma Parameters
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Delivered Power
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.delivered_power ? `${experiment.delivered_power} W` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                DC Voltage
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.dc_voltage ? `${experiment.dc_voltage} V` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                DC Current
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.dc_current ? `${experiment.dc_current} mA` : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Electrode
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.electrode || 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Reactor Temperature
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.reactor_external_temperature
                                    ? `${experiment.reactor_external_temperature} °C`
                                    : 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Driving Waveform
                            </p>
                            {experiment.driving_waveform ? (
                                <Link
                                    to={`/waveforms/${experiment.driving_waveform.id}`}
                                    style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                                >
                                    {experiment.driving_waveform.name}
                                </Link>
                            ) : (
                                <p style={{ fontWeight: 500, margin: 0 }}>Not specified</p>
                            )}
                        </div>
                    </div>
                    {/* Pulsing Info */}
                    {(experiment.on_time || experiment.off_time) && (
                        <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                Pulsing Configuration {experiment.is_pulsed && <Badge variant="info">Pulsed</Badge>}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        On Time
                                    </p>
                                    <p style={{ fontWeight: 500, margin: 0 }}>
                                        {experiment.on_time ? `${experiment.on_time} ms` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Off Time
                                    </p>
                                    <p style={{ fontWeight: 500, margin: 0 }}>
                                        {experiment.off_time ? `${experiment.off_time} ms` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Duty Cycle
                                    </p>
                                    <p style={{ fontWeight: 500, margin: 0 }}>
                                        {experiment.duty_cycle ? `${experiment.duty_cycle.toFixed(1)}%` : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isPhotocatalysisExperiment(experiment) && (
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Photocatalysis Parameters
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Wavelength
                            </p>
                            <p style={{ fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                <span>{experiment.wavelength ? `${experiment.wavelength} nm` : 'Not specified'}</span>
                                {experiment.is_uv && <Badge variant="info">UV</Badge>}
                                {experiment.is_visible && <Badge variant="success">Visible</Badge>}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                Light Power
                            </p>
                            <p style={{ fontWeight: 500, margin: 0 }}>
                                {experiment.power ? `${experiment.power} W` : 'Not specified'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isMiscExperiment(experiment) && experiment.description && (
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Description
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{experiment.description}</p>
                </div>
            )}

            {/* Equipment */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Equipment
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Reactor
                        </p>
                        {experiment.reactor ? (
                            <Link
                                to={`/reactors/${experiment.reactor.id}`}
                                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                            >
                                {experiment.reactor.description || `Reactor #${experiment.reactor.id}`}
                                {experiment.reactor.volume && ` (${experiment.reactor.volume} mL)`}
                            </Link>
                        ) : (
                            <p style={{ fontWeight: 500, margin: 0 }}>Not specified</p>
                        )}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Analyzer
                        </p>
                        {experiment.analyzer ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                <Link
                                    to={`/analyzers/${experiment.analyzer.id}`}
                                    style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                                >
                                    {experiment.analyzer.name}
                                </Link>
                                <Badge variant={experiment.analyzer.analyzer_type === 'ftir' ? 'info' : 'success'}>
                                    {ANALYZER_TYPE_LABELS[experiment.analyzer.analyzer_type as AnalyzerType]}
                                </Badge>
                            </span>
                        ) : (
                            <p style={{ fontWeight: 500, margin: 0 }}>Not specified</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contaminants */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Contaminants ({experiment.contaminants?.length || 0})
                </h2>
                {experiment.contaminants && experiment.contaminants.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                        {experiment.contaminants.map((contaminant) => (
                            <Link
                                key={contaminant.id}
                                to={`/contaminants/${contaminant.id}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'var(--color-primary)',
                                    fontWeight: 500,
                                }}
                            >
                                {contaminant.name}
                                {contaminant.ppm && (
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                        ({contaminant.ppm} ppm)
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No contaminants specified.
                    </p>
                )}
            </div>

            {/* Carriers */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Carrier Gases ({experiment.carriers?.length || 0})
                </h2>
                {experiment.carriers && experiment.carriers.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                        {experiment.carriers.map((carrier) => (
                            <Link
                                key={carrier.id}
                                to={`/carriers/${carrier.id}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'var(--color-primary)',
                                    fontWeight: 500,
                                }}
                            >
                                {carrier.name}
                                {carrier.ratio && (
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                        ({carrier.ratio}%)
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No carrier gases specified.
                    </p>
                )}
            </div>

            {/* Samples */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Samples ({experiment.samples?.length || 0})
                </h2>
                {experiment.samples && experiment.samples.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {experiment.samples.map((sample) => (
                            <Link
                                key={sample.id}
                                to={`/samples/${sample.id}`}
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
                                <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                    {sample.name}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    {sample.storage_location}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        No samples linked to this experiment.
                    </p>
                )}
            </div>

            {/* Groups */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Groups ({experiment.groups?.length || 0})
                </h2>
                {experiment.groups && experiment.groups.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                        {experiment.groups.map((group) => (
                            <Link
                                key={group.id}
                                to={`/groups/${group.id}`}
                                style={{
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    textDecoration: 'none',
                                    color: 'var(--color-primary)',
                                    fontWeight: 500,
                                }}
                            >
                                {group.name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        This experiment is not part of any groups.
                    </p>
                )}
            </div>

            {/* Files */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Files
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Raw Data
                        </p>
                        {experiment.raw_data_file ? (
                            <Link
                                to={`/files/${experiment.raw_data_file.id}`}
                                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                            >
                                {experiment.raw_data_file.filename}
                            </Link>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Not uploaded</p>
                        )}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Figures
                        </p>
                        {experiment.figures_file ? (
                            <Link
                                to={`/files/${experiment.figures_file.id}`}
                                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                            >
                                {experiment.figures_file.filename}
                            </Link>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Not uploaded</p>
                        )}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Discussion
                        </p>
                        {experiment.discussed_in_file ? (
                            <Link
                                to={`/files/${experiment.discussed_in_file.id}`}
                                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
                            >
                                {experiment.discussed_in_file.filename}
                            </Link>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Not linked</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Conclusion & Notes */}
            {(experiment.conclusion || experiment.notes) && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    {experiment.conclusion && (
                        <div style={{ marginBottom: experiment.notes ? 'var(--spacing-lg)' : 0 }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                                Conclusion
                            </h2>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{experiment.conclusion}</p>
                        </div>
                    )}
                    {experiment.notes && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                                Notes
                            </h2>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{experiment.notes}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Metadata */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Metadata
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Created
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(experiment.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Last Updated
                        </p>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                            {format(new Date(experiment.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
                {experiment.users && experiment.users.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Researchers
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                            {experiment.users.map((user) => (
                                <Link
                                    key={user.id}
                                    to={`/users/${user.id}`}
                                    style={{
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--border-radius)',
                                        textDecoration: 'none',
                                        color: 'var(--color-primary)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {user.full_name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
