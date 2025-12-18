/**
 * AnalyzerFormPage - Form for creating and editing analyzers.
 *
 * Dynamically shows type-specific fields based on analyzer type selection.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAnalyzer, useCreateAnalyzer, useUpdateAnalyzer } from '@/hooks/useAnalyzers';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import {
    type AnalyzerType,
    type AnalyzerCreate,
    type FTIRCreate,
    type OESCreate,
    isFTIRAnalyzer,
} from '@/services/api';

// Form data type that covers both FTIR and OES fields
interface AnalyzerFormData {
    name: string;
    analyzer_type: AnalyzerType;
    description: string;
    // FTIR fields
    path_length: string;
    resolution: string;
    interval: string;
    ftir_scans: string;
    // OES fields
    integration_time: string;
    oes_scans: string;
}

export const AnalyzerFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: analyzer, isLoading: isLoadingAnalyzer } = useAnalyzer(
        id ? parseInt(id) : undefined
    );

    const createMutation = useCreateAnalyzer();
    const updateMutation = useUpdateAnalyzer();

    // Track current analyzer type for showing/hiding fields
    const [currentType, setCurrentType] = useState<AnalyzerType>('ftir');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<AnalyzerFormData>({
        defaultValues: {
            name: '',
            analyzer_type: 'ftir',
            description: '',
            path_length: '',
            resolution: '',
            interval: '',
            ftir_scans: '',
            integration_time: '',
            oes_scans: '',
        },
    });

    // Watch analyzer_type to update form display
    const watchedType = watch('analyzer_type');
    useEffect(() => {
        setCurrentType(watchedType);
    }, [watchedType]);

    useEffect(() => {
        if (analyzer) {
            const baseData = {
                name: analyzer.name,
                analyzer_type: analyzer.analyzer_type,
                description: analyzer.description || '',
                path_length: '',
                resolution: '',
                interval: '',
                ftir_scans: '',
                integration_time: '',
                oes_scans: '',
            };

            if (isFTIRAnalyzer(analyzer)) {
                baseData.path_length = analyzer.path_length || '';
                baseData.resolution = analyzer.resolution || '';
                baseData.interval = analyzer.interval || '';
                baseData.ftir_scans = analyzer.scans?.toString() || '';
            } else {
                baseData.integration_time = analyzer.integration_time?.toString() || '';
                baseData.oes_scans = analyzer.scans?.toString() || '';
            }

            reset(baseData);
            setCurrentType(analyzer.analyzer_type);
        }
    }, [analyzer, reset]);

    const onSubmit = async (data: AnalyzerFormData) => {
        try {
            let createData: AnalyzerCreate;

            if (data.analyzer_type === 'ftir') {
                createData = {
                    name: data.name,
                    analyzer_type: 'ftir',
                    description: data.description || undefined,
                    path_length: data.path_length || undefined,
                    resolution: data.resolution || undefined,
                    interval: data.interval || undefined,
                    scans: data.ftir_scans ? parseInt(data.ftir_scans) : undefined,
                } as FTIRCreate;
            } else {
                createData = {
                    name: data.name,
                    analyzer_type: 'oes',
                    description: data.description || undefined,
                    integration_time: data.integration_time ? parseInt(data.integration_time) : undefined,
                    scans: data.oes_scans ? parseInt(data.oes_scans) : undefined,
                } as OESCreate;
            }

            if (isEditing && id) {
                // For updates, strip the analyzer_type since it can't be changed
                const { analyzer_type, ...updateData } = createData;
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: updateData,
                });
                navigate(`/analyzers/${id}`);
            } else {
                const newAnalyzer = await createMutation.mutateAsync(createData);
                navigate(`/analyzers/${newAnalyzer.id}`);
            }
        } catch (error) {
            console.error('Failed to save analyzer:', error);
        }
    };

    if (isEditing && isLoadingAnalyzer) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading analyzer...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/analyzers"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Analyzers
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Analyzer' : 'Add New Analyzer'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update analyzer configuration'
                        : 'Add a new analyzer instrument for experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Basic Info */}
                    <FormField
                        label="Analyzer Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Nicolet iS50 FTIR, Ocean Optics USB4000"
                        />
                    </FormField>

                    <FormField
                        label="Analyzer Type"
                        error={errors.analyzer_type?.message}
                        required
                        helpText={isEditing ? 'Type cannot be changed after creation' : undefined}
                    >
                        <Select
                            {...register('analyzer_type')}
                            disabled={isEditing}
                        >
                            <option value="ftir">FTIR Spectrometer</option>
                            <option value="oes">Optical Emission Spectrometer (OES)</option>
                        </Select>
                    </FormField>

                    <FormField
                        label="Description"
                        error={errors.description?.message}
                        helpText="Configuration details, calibration notes, etc."
                    >
                        <TextArea
                            {...register('description')}
                            placeholder="Detailed description of the analyzer and its configuration"
                            rows={3}
                        />
                    </FormField>

                    {/* FTIR-Specific Fields */}
                    {currentType === 'ftir' && (
                        <>
                            <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>FTIR Parameters</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0 0' }}>
                                    Configuration specific to FTIR spectrometers
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                <FormField
                                    label="Path Length (cm)"
                                    error={errors.path_length?.message}
                                    helpText="Optical path length through gas cell"
                                >
                                    <TextInput
                                        {...register('path_length', {
                                            validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                                        })}
                                        placeholder="e.g., 10.0"
                                    />
                                </FormField>

                                <FormField
                                    label="Resolution (cm⁻¹)"
                                    error={errors.resolution?.message}
                                    helpText="Spectral resolution"
                                >
                                    <TextInput
                                        {...register('resolution', {
                                            validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                                        })}
                                        placeholder="e.g., 4.0"
                                    />
                                </FormField>

                                <FormField
                                    label="Interval"
                                    error={errors.interval?.message}
                                    helpText="Data point spacing"
                                >
                                    <TextInput
                                        {...register('interval', {
                                            validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                                        })}
                                        placeholder="e.g., 1.0"
                                    />
                                </FormField>

                                <FormField
                                    label="Scans"
                                    error={errors.ftir_scans?.message}
                                    helpText="Number of scans averaged"
                                >
                                    <TextInput
                                        {...register('ftir_scans', {
                                            validate: (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) > 0) || 'Must be a positive integer',
                                        })}
                                        placeholder="e.g., 64"
                                    />
                                </FormField>
                            </div>
                        </>
                    )}

                    {/* OES-Specific Fields */}
                    {currentType === 'oes' && (
                        <>
                            <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>OES Parameters</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0 0' }}>
                                    Configuration specific to Optical Emission Spectrometers
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                <FormField
                                    label="Integration Time (ms)"
                                    error={errors.integration_time?.message}
                                    helpText="Exposure time per measurement"
                                >
                                    <TextInput
                                        {...register('integration_time', {
                                            validate: (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) > 0) || 'Must be a positive integer',
                                        })}
                                        placeholder="e.g., 500"
                                    />
                                </FormField>

                                <FormField
                                    label="Scans"
                                    error={errors.oes_scans?.message}
                                    helpText="Number of spectra averaged"
                                >
                                    <TextInput
                                        {...register('oes_scans', {
                                            validate: (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) > 0) || 'Must be a positive integer',
                                        })}
                                        placeholder="e.g., 50"
                                    />
                                </FormField>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Analyzer'
                                    : 'Create Analyzer'}
                        </Button>
                        <Link to="/analyzers">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving analyzer. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};