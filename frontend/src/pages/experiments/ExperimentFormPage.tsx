/**
 * ExperimentFormPage - Form for creating and editing experiments.
 *
 * Complex form handling polymorphic experiment types with dynamic type-specific
 * fields and multiple relationship selections.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useExperiment, useCreateExperiment, useUpdateExperiment } from '@/hooks/useExperiments';
import { useWaveforms } from '@/hooks/useWaveforms';
import { useReactors } from '@/hooks/useReactors';
import { useAnalyzers } from '@/hooks/useAnalyzers';
import { useSamples } from '@/hooks/useSamples';
import { useContaminants } from '@/hooks/useContaminants';
import { useCarriers } from '@/hooks/useCarriers';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';
import { useFiles } from '@/hooks/useFiles';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import {
    type ExperimentType,
    type ExperimentCreate,
    type PlasmaCreate,
    type PhotocatalysisCreate,
    type MiscCreate,
    isPlasmaExperiment,
    isPhotocatalysisExperiment,
    isMiscExperiment,
    EXPERIMENT_TYPE_LABELS,
} from '@/services/api';

// Form data type covering all experiment fields
interface ExperimentFormData {
    name: string;
    experiment_type: ExperimentType;
    purpose: string;
    reactor_id: string;
    analyzer_id: string;
    raw_data_id: string;
    figures_id: string;
    discussed_in_id: string;
    conclusion: string;
    notes: string;
    // Plasma-specific
    driving_waveform_id: string;
    delivered_power: string;
    on_time: string;
    off_time: string;
    dc_voltage: string;
    dc_current: string;
    electrode: string;
    reactor_external_temperature: string;
    // Photocatalysis-specific
    wavelength: string;
    power: string;
    // Misc-specific
    description: string;
    // Relationships
    sample_ids: number[];
    contaminants: { id: number; ppm: string }[];
    carriers: { id: number; ratio: string }[];
    group_ids: number[];
    user_ids: number[];
}

export const ExperimentFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: experiment, isLoading: isLoadingExperiment } = useExperiment(
        id ? parseInt(id) : undefined,
        'samples,contaminants,carriers,groups,users'
    );

    // Reference data
    const { data: waveforms } = useWaveforms();
    const { data: reactors } = useReactors();
    const { data: analyzers } = useAnalyzers();
    const { data: samples } = useSamples();
    const { data: contaminantsList } = useContaminants();
    const { data: carriersList } = useCarriers();
    const { data: groups } = useGroups();
    const { data: users } = useUsers({ is_active: true });
    const { data: files } = useFiles({ limit: 100 });

    const createMutation = useCreateExperiment();
    const updateMutation = useUpdateExperiment();

    // Track current type for showing/hiding fields
    const [currentType, setCurrentType] = useState<ExperimentType>('plasma');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        control,
        setValue,
    } = useForm<ExperimentFormData>({
        defaultValues: {
            name: '',
            experiment_type: 'plasma',
            purpose: '',
            reactor_id: '',
            analyzer_id: '',
            raw_data_id: '',
            figures_id: '',
            discussed_in_id: '',
            conclusion: '',
            notes: '',
            driving_waveform_id: '',
            delivered_power: '',
            on_time: '',
            off_time: '',
            dc_voltage: '',
            dc_current: '',
            electrode: '',
            reactor_external_temperature: '',
            wavelength: '',
            power: '',
            description: '',
            sample_ids: [],
            contaminants: [],
            carriers: [],
            group_ids: [],
            user_ids: [],
        },
    });

    // Field arrays for contaminants and carriers
    const { fields: contaminantFields, append: appendContaminant, remove: removeContaminant } = useFieldArray({
        control,
        name: 'contaminants',
    });

    const { fields: carrierFields, append: appendCarrier, remove: removeCarrier } = useFieldArray({
        control,
        name: 'carriers',
    });

    // Watch type changes
    const watchedType = watch('experiment_type');
    useEffect(() => {
        setCurrentType(watchedType);
    }, [watchedType]);

    // Populate form when editing
    useEffect(() => {
        if (experiment) {
            const baseData: Partial<ExperimentFormData> = {
                name: experiment.name,
                experiment_type: experiment.experiment_type,
                purpose: experiment.purpose,
                reactor_id: experiment.reactor_id?.toString() || '',
                analyzer_id: experiment.analyzer_id?.toString() || '',
                raw_data_id: experiment.raw_data_id?.toString() || '',
                figures_id: experiment.figures_id?.toString() || '',
                discussed_in_id: experiment.discussed_in_id?.toString() || '',
                conclusion: experiment.conclusion || '',
                notes: experiment.notes || '',
                sample_ids: experiment.samples?.map(s => s.id) || [],
                contaminants: experiment.contaminants?.map(c => ({ id: c.id, ppm: c.ppm || '' })) || [],
                carriers: experiment.carriers?.map(c => ({ id: c.id, ratio: c.ratio || '' })) || [],
                group_ids: experiment.groups?.map(g => g.id) || [],
                user_ids: experiment.users?.map(u => u.id) || [],
            };

            if (isPlasmaExperiment(experiment)) {
                baseData.driving_waveform_id = experiment.driving_waveform_id?.toString() || '';
                baseData.delivered_power = experiment.delivered_power || '';
                baseData.on_time = experiment.on_time?.toString() || '';
                baseData.off_time = experiment.off_time?.toString() || '';
                baseData.dc_voltage = experiment.dc_voltage?.toString() || '';
                baseData.dc_current = experiment.dc_current?.toString() || '';
                baseData.electrode = experiment.electrode || '';
                baseData.reactor_external_temperature = experiment.reactor_external_temperature?.toString() || '';
            } else if (isPhotocatalysisExperiment(experiment)) {
                baseData.wavelength = experiment.wavelength || '';
                baseData.power = experiment.power || '';
            } else if (isMiscExperiment(experiment)) {
                baseData.description = experiment.description || '';
            }

            reset(baseData as ExperimentFormData);
            setCurrentType(experiment.experiment_type);
        }
    }, [experiment, reset]);

    const onSubmit = async (data: ExperimentFormData) => {
        try {
            // Build base create data
            const baseData = {
                name: data.name,
                purpose: data.purpose,
                reactor_id: data.reactor_id ? parseInt(data.reactor_id) : undefined,
                analyzer_id: data.analyzer_id ? parseInt(data.analyzer_id) : undefined,
                raw_data_id: data.raw_data_id ? parseInt(data.raw_data_id) : undefined,
                figures_id: data.figures_id ? parseInt(data.figures_id) : undefined,
                discussed_in_id: data.discussed_in_id ? parseInt(data.discussed_in_id) : undefined,
                conclusion: data.conclusion || undefined,
                notes: data.notes || undefined,
                sample_ids: data.sample_ids.length > 0 ? data.sample_ids : undefined,
                contaminant_data: data.contaminants.length > 0
                    ? data.contaminants.map(c => ({ id: c.id, ppm: c.ppm ? parseFloat(c.ppm) : undefined }))
                    : undefined,
                carrier_data: data.carriers.length > 0
                    ? data.carriers.map(c => ({ id: c.id, ratio: c.ratio ? parseFloat(c.ratio) : undefined }))
                    : undefined,
                group_ids: data.group_ids.length > 0 ? data.group_ids : undefined,
                user_ids: data.user_ids.length > 0 ? data.user_ids : undefined,
            };

            let createData: ExperimentCreate;

            if (data.experiment_type === 'plasma') {
                createData = {
                    ...baseData,
                    experiment_type: 'plasma',
                    driving_waveform_id: data.driving_waveform_id ? parseInt(data.driving_waveform_id) : undefined,
                    delivered_power: data.delivered_power || undefined,
                    on_time: data.on_time ? parseInt(data.on_time) : undefined,
                    off_time: data.off_time ? parseInt(data.off_time) : undefined,
                    dc_voltage: data.dc_voltage ? parseFloat(data.dc_voltage) : undefined,
                    dc_current: data.dc_current ? parseFloat(data.dc_current) : undefined,
                    electrode: data.electrode || undefined,
                    reactor_external_temperature: data.reactor_external_temperature
                        ? parseFloat(data.reactor_external_temperature) : undefined,
                } as PlasmaCreate;
            } else if (data.experiment_type === 'photocatalysis') {
                createData = {
                    ...baseData,
                    experiment_type: 'photocatalysis',
                    wavelength: data.wavelength || undefined,
                    power: data.power || undefined,
                } as PhotocatalysisCreate;
            } else {
                createData = {
                    ...baseData,
                    experiment_type: 'misc',
                    description: data.description || undefined,
                } as MiscCreate;
            }

            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: createData,
                });
                navigate(`/experiments/${id}`);
            } else {
                const newExperiment = await createMutation.mutateAsync(createData);
                navigate(`/experiments/${newExperiment.id}`);
            }
        } catch (error) {
            console.error('Failed to save experiment:', error);
        }
    };

    // Handle sample multi-select
    const handleSampleToggle = (sampleId: number) => {
        const current = watch('sample_ids');
        if (current.includes(sampleId)) {
            setValue('sample_ids', current.filter(id => id !== sampleId));
        } else {
            setValue('sample_ids', [...current, sampleId]);
        }
    };

    // Handle group multi-select
    const handleGroupToggle = (groupId: number) => {
        const current = watch('group_ids');
        if (current.includes(groupId)) {
            setValue('group_ids', current.filter(id => id !== groupId));
        } else {
            setValue('group_ids', [...current, groupId]);
        }
    };

    // Handle user multi-select
    const handleUserToggle = (userId: number) => {
        const current = watch('user_ids');
        if (current.includes(userId)) {
            setValue('user_ids', current.filter(id => id !== userId));
        } else {
            setValue('user_ids', [...current, userId]);
        }
    };

    if (isEditing && isLoadingExperiment) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading experiment...</p>
                </div>
            </div>
        );
    }

    const selectedSampleIds = watch('sample_ids');
    const selectedGroupIds = watch('group_ids');
    const selectedUserIds = watch('user_ids');

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/experiments"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Experiments
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Experiment' : 'New Experiment'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update experiment details and results'
                        : 'Record a new catalysis experiment'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Info */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Basic Information
                    </h2>

                    <FormField label="Experiment Name" error={errors.name?.message} required>
                        <TextInput
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g., TiO2-5wt%-Plasma-100W"
                        />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <FormField
                            label="Experiment Type"
                            error={errors.experiment_type?.message}
                            required
                            helpText={isEditing ? 'Type cannot be changed after creation' : undefined}
                        >
                            <Select {...register('experiment_type')} disabled={isEditing}>
                                <option value="plasma">Plasma Catalysis</option>
                                <option value="photocatalysis">Photocatalysis</option>
                                <option value="misc">Miscellaneous</option>
                            </Select>
                        </FormField>

                        <FormField label="Reactor" error={errors.reactor_id?.message}>
                            <Select {...register('reactor_id')}>
                                <option value="">-- Select Reactor --</option>
                                {reactors?.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.description || `Reactor #${r.id}`}
                                        {r.volume && ` (${r.volume} mL)`}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    <FormField label="Purpose" error={errors.purpose?.message} required>
                        <TextArea
                            {...register('purpose', { required: 'Purpose is required' })}
                            placeholder="What is this experiment trying to achieve?"
                            rows={2}
                        />
                    </FormField>
                </div>

                {/* Type-Specific Parameters */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        {EXPERIMENT_TYPE_LABELS[currentType]} Parameters
                    </h2>

                    {currentType === 'plasma' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                <FormField label="Driving Waveform">
                                    <Select {...register('driving_waveform_id')}>
                                        <option value="">-- Select Waveform --</option>
                                        {waveforms?.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </Select>
                                </FormField>

                                <FormField label="Delivered Power (W)">
                                    <TextInput {...register('delivered_power')} placeholder="e.g., 100" />
                                </FormField>

                                <FormField label="On Time (ms)" helpText="For pulsed operation">
                                    <TextInput {...register('on_time')} placeholder="e.g., 1000" />
                                </FormField>

                                <FormField label="Off Time (ms)" helpText="For pulsed operation">
                                    <TextInput {...register('off_time')} placeholder="e.g., 1000" />
                                </FormField>

                                <FormField label="DC Voltage (V)">
                                    <TextInput {...register('dc_voltage')} placeholder="e.g., 15" />
                                </FormField>

                                <FormField label="DC Current (mA)">
                                    <TextInput {...register('dc_current')} placeholder="e.g., 50" />
                                </FormField>

                                <FormField label="Electrode">
                                    <TextInput {...register('electrode')} placeholder="e.g., Stainless steel mesh" />
                                </FormField>

                                <FormField label="External Temperature (°C)">
                                    <TextInput {...register('reactor_external_temperature')} placeholder="e.g., 25" />
                                </FormField>
                            </div>
                        </>
                    )}

                    {currentType === 'photocatalysis' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                            <FormField label="Wavelength (nm)" helpText="UV: <400nm, Visible: 400-700nm">
                                <TextInput {...register('wavelength')} placeholder="e.g., 365" />
                            </FormField>

                            <FormField label="Power (W or mW/cm²)">
                                <TextInput {...register('power')} placeholder="e.g., 10" />
                            </FormField>
                        </div>
                    )}

                    {currentType === 'misc' && (
                        <FormField label="Description" helpText="Describe the experiment type and parameters">
                            <TextArea
                                {...register('description')}
                                placeholder="Detailed description of the experiment setup and conditions"
                                rows={4}
                            />
                        </FormField>
                    )}
                </div>

                {/* Equipment */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Equipment
                    </h2>
                    <FormField label="Analyzer">
                        <Select {...register('analyzer_id')}>
                            <option value="">-- Select Analyzer --</option>
                            {analyzers?.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.analyzer_type.toUpperCase()})
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </div>

                {/* Samples */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Samples ({selectedSampleIds.length} selected)
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)', maxHeight: '200px', overflowY: 'auto' }}>
                        {samples?.map(sample => (
                            <label
                                key={sample.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedSampleIds.includes(sample.id) ? 'var(--color-primary-light)' : 'transparent',
                                    borderRadius: 'var(--border-radius)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSampleIds.includes(sample.id)}
                                    onChange={() => handleSampleToggle(sample.id)}
                                />
                                <span style={{ fontSize: '0.875rem' }}>{sample.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Contaminants */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                            Contaminants ({contaminantFields.length})
                        </h2>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => appendContaminant({ id: 0, ppm: '' })}
                        >
                            Add Contaminant
                        </Button>
                    </div>
                    {contaminantFields.length > 0 ? (
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            {contaminantFields.map((field, index) => (
                                <div key={field.id} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2 }}>
                                        <label className="form-label">Contaminant</label>
                                        <Controller
                                            control={control}
                                            name={`contaminants.${index}.id`}
                                            render={({ field: { onChange, value } }) => (
                                                <Select value={value} onChange={(e) => onChange(parseInt(e.target.value))}>
                                                    <option value="0">-- Select --</option>
                                                    {contaminantsList?.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">PPM</label>
                                        <TextInput
                                            {...register(`contaminants.${index}.ppm`)}
                                            placeholder="e.g., 100"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removeContaminant(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                            No contaminants added. Click "Add Contaminant" to specify target compounds.
                        </p>
                    )}
                </div>

                {/* Carriers */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                            Carrier Gases ({carrierFields.length})
                        </h2>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => appendCarrier({ id: 0, ratio: '' })}
                        >
                            Add Carrier
                        </Button>
                    </div>
                    {carrierFields.length > 0 ? (
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            {carrierFields.map((field, index) => (
                                <div key={field.id} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2 }}>
                                        <label className="form-label">Carrier Gas</label>
                                        <Controller
                                            control={control}
                                            name={`carriers.${index}.id`}
                                            render={({ field: { onChange, value } }) => (
                                                <Select value={value} onChange={(e) => onChange(parseInt(e.target.value))}>
                                                    <option value="0">-- Select --</option>
                                                    {carriersList?.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Ratio</label>
                                        <TextInput
                                            {...register(`carriers.${index}.ratio`)}
                                            placeholder="e.g., 0.8"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removeCarrier(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                            No carrier gases added. Click "Add Carrier" to specify flow composition.
                        </p>
                    )}
                </div>

                {/* Groups */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Groups ({selectedGroupIds.length} selected)
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                        {groups?.map(group => (
                            <label
                                key={group.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedGroupIds.includes(group.id) ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedGroupIds.includes(group.id)}
                                    onChange={() => handleGroupToggle(group.id)}
                                />
                                <span style={{ fontSize: '0.875rem' }}>{group.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Files */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Files
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                        <FormField label="Raw Data">
                            <Select {...register('raw_data_id')}>
                                <option value="">-- No file --</option>
                                {files?.map(f => (
                                    <option key={f.id} value={f.id}>{f.filename}</option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="Figures">
                            <Select {...register('figures_id')}>
                                <option value="">-- No file --</option>
                                {files?.map(f => (
                                    <option key={f.id} value={f.id}>{f.filename}</option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="Discussion File">
                            <Select {...register('discussed_in_id')}>
                                <option value="">-- No file --</option>
                                {files?.map(f => (
                                    <option key={f.id} value={f.id}>{f.filename}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>
                </div>

                {/* Researchers */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Researchers ({selectedUserIds.length} selected)
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                        {users?.map(user => (
                            <label
                                key={user.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedUserIds.includes(user.id) ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.includes(user.id)}
                                    onChange={() => handleUserToggle(user.id)}
                                />
                                <span style={{ fontSize: '0.875rem' }}>{user.full_name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Notes & Conclusion */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                        Notes & Conclusion
                    </h2>

                    <FormField label="Notes" helpText="Observations, issues, or additional details">
                        <TextArea
                            {...register('notes')}
                            placeholder="Any relevant notes about the experiment..."
                            rows={3}
                        />
                    </FormField>

                    <FormField label="Conclusion" helpText="Summary of findings - marks experiment as completed">
                        <TextArea
                            {...register('conclusion')}
                            placeholder="Key findings and conclusions from this experiment..."
                            rows={4}
                        />
                    </FormField>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                    >
                        {isSubmitting || createMutation.isPending || updateMutation.isPending
                            ? 'Saving...'
                            : isEditing
                                ? 'Update Experiment'
                                : 'Create Experiment'}
                    </Button>
                    <Link to="/experiments">
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </Link>
                </div>

                {(createMutation.isError || updateMutation.isError) && (
                    <div className="card" style={{ marginTop: 'var(--spacing-md)', backgroundColor: 'var(--color-danger)', color: 'white' }}>
                        Error saving experiment. Please try again.
                    </div>
                )}
            </form>
        </div>
    );
};