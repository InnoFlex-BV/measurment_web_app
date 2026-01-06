/**
 * ObservationFormPage - Form for creating and editing observations.
 *
 * Observations are qualitative research notes that can be linked to catalysts,
 * samples, and files. This form handles the structured observation data including
 * JSONB fields for conditions, calcination parameters, and collected data.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    useObservation,
    useCreateObservation,
    useUpdateObservation,
} from '@/hooks/useObservations';
import { useUsers } from '@/hooks/useUsers';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import type { ObservationCreate, ObservationUpdate } from '@/services/api';

interface FormData {
    objective: string;
    observations_text: string;
    conclusions: string;
    user_ids: number[];
    // Condition fields (will be combined into conditions JSONB)
    temperature?: string;
    temperature_unit?: string;
    atmosphere?: string;
    duration?: string;
    duration_unit?: string;
    pressure?: string;
    // Calcination fields (will be combined into calcination_parameters JSONB)
    ramp_rate?: string;
    target_temperature?: string;
    hold_time?: string;
    hold_unit?: string;
    calcination_atmosphere?: string;
    cooling?: string;
    // Data fields (will be combined into data JSONB)
    mass_before?: string;
    mass_after?: string;
    color_before?: string;
    color_after?: string;
    notes?: string;
}

export const ObservationFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id;

    // Track whether calcination section is expanded
    const [showCalcination, setShowCalcination] = useState(false);

    // Pre-fill from URL params (when creating from sample/catalyst detail)
    const prefilledSampleId = searchParams.get('sample_id');
    const prefilledCatalystId = searchParams.get('catalyst_id');

    // Fetch existing observation if editing
    const { data: observation, isLoading: isLoadingObservation } = useObservation(
        id ? parseInt(id) : undefined,
        'users'
    );

    // Fetch users for dropdown
    const { data: users } = useUsers({ is_active: true });

    // Mutations
    const createMutation = useCreateObservation();
    const updateMutation = useUpdateObservation();

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<FormData>({
        defaultValues: {
            objective: '',
            observations_text: '',
            conclusions: '',
            user_ids: [],
        },
    });

    const selectedUserIds = watch('user_ids');

    // Helper to safely get string from unknown
    const getString = (value: unknown, fallback = ''): string => {
        if (value === null || value === undefined) return fallback;
        return String(value);
    };

    // Pre-populate form when editing
    useEffect(() => {
        if (observation) {
            const conditions = observation.conditions || {};
            const calcParams = observation.calcination_parameters || {};
            const data = observation.data || {};

            reset({
                objective: observation.objective,
                observations_text: observation.observations_text,
                conclusions: observation.conclusions,
                user_ids: observation.users?.map(u => u.id) || [],
                // Conditions
                temperature: getString(conditions.temperature),
                temperature_unit: getString(conditions.temperature_unit, '°C'),
                atmosphere: getString(conditions.atmosphere),
                duration: getString(conditions.duration),
                duration_unit: getString(conditions.duration_unit, 'hours'),
                pressure: getString(conditions.pressure),
                // Calcination
                ramp_rate: getString(calcParams.ramp_rate),
                target_temperature: getString(calcParams.target_temperature),
                hold_time: getString(calcParams.hold_time),
                hold_unit: getString(calcParams.hold_unit, 'hours'),
                calcination_atmosphere: getString(calcParams.atmosphere),
                cooling: getString(calcParams.cooling),
                // Data
                mass_before: getString(data.mass_before),
                mass_after: getString(data.mass_after),
                color_before: getString(data.color_before),
                color_after: getString(data.color_after),
                notes: getString(data.notes),
            });

            // Show calcination section if there's calcination data
            if (Object.keys(calcParams).length > 0) {
                setShowCalcination(true);
            }
        }
    }, [observation, reset]);

    const onSubmit = async (formData: FormData) => {
        // Build conditions JSONB
        const conditions: Record<string, unknown> = {};
        if (formData.temperature) {
            conditions.temperature = parseFloat(formData.temperature);
            conditions.temperature_unit = formData.temperature_unit || '°C';
        }
        if (formData.atmosphere) conditions.atmosphere = formData.atmosphere;
        if (formData.duration) {
            conditions.duration = parseFloat(formData.duration);
            conditions.duration_unit = formData.duration_unit || 'hours';
        }
        if (formData.pressure) {
            conditions.pressure = parseFloat(formData.pressure);
            conditions.pressure_unit = 'atm';
        }

        // Build calcination_parameters JSONB
        const calcination_parameters: Record<string, unknown> = {};
        if (showCalcination) {
            if (formData.ramp_rate) {
                calcination_parameters.ramp_rate = parseFloat(formData.ramp_rate);
                calcination_parameters.ramp_unit = '°C/min';
            }
            if (formData.target_temperature) {
                calcination_parameters.target_temperature = parseFloat(formData.target_temperature);
            }
            if (formData.hold_time) {
                calcination_parameters.hold_time = parseFloat(formData.hold_time);
                calcination_parameters.hold_unit = formData.hold_unit || 'hours';
            }
            if (formData.calcination_atmosphere) {
                calcination_parameters.atmosphere = formData.calcination_atmosphere;
            }
            if (formData.cooling) calcination_parameters.cooling = formData.cooling;
        }

        // Build data JSONB
        const data: Record<string, unknown> = {};
        if (formData.mass_before) data.mass_before = parseFloat(formData.mass_before);
        if (formData.mass_after) data.mass_after = parseFloat(formData.mass_after);
        if (formData.mass_before && formData.mass_after) {
            const before = parseFloat(formData.mass_before);
            const after = parseFloat(formData.mass_after);
            if (before > 0) {
                data.mass_loss_percent = Math.round(((before - after) / before) * 100 * 10) / 10;
            }
        }
        if (formData.color_before) data.color_before = formData.color_before;
        if (formData.color_after) data.color_after = formData.color_after;
        if (formData.notes) data.notes = formData.notes;

        const payload: ObservationCreate = {
            objective: formData.objective,
            observations_text: formData.observations_text,
            conclusions: formData.conclusions,
            conditions,
            calcination_parameters,
            data,
            user_ids: formData.user_ids?.length ? formData.user_ids : undefined,
            catalyst_ids: prefilledCatalystId ? [parseInt(prefilledCatalystId)] : undefined,
            sample_ids: prefilledSampleId ? [parseInt(prefilledSampleId)] : undefined,
        };

        if (isEditing && observation) {
            const updateData: ObservationUpdate = payload;
            updateMutation.mutate(
                { id: observation.id, data: updateData },
                {
                    onSuccess: (updated) => {
                        navigate(`/observations/${updated.id}`);
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (newObservation) => {
                    navigate(`/observations/${newObservation.id}`);
                },
            });
        }
    };

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = parseInt(e.target.value);
        if (userId && !selectedUserIds?.includes(userId)) {
            setValue('user_ids', [...(selectedUserIds || []), userId]);
        }
        e.target.value = '';
    };

    const removeUser = (userId: number) => {
        setValue('user_ids', (selectedUserIds || []).filter(id => id !== userId));
    };

    if (isEditing && isLoadingObservation) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading observation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isEditing ? 'Edit Observation' : 'Add Observation'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update observation details'
                        : 'Record a new qualitative research note'}
                </p>
            </div>

            {/* Context Banner */}
            {(prefilledSampleId || prefilledCatalystId) && !isEditing && (
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--spacing-lg)',
                        backgroundColor: 'var(--color-info)',
                        color: 'white',
                    }}
                >
                    <p style={{ margin: 0 }}>
                        This observation will be linked to{' '}
                        {prefilledSampleId ? `Sample #${prefilledSampleId}` : `Catalyst #${prefilledCatalystId}`}
                        {' '}after creation.
                    </p>
                </div>
            )}

            <div className="card" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Objective */}
                    <FormField
                        label="Objective"
                        error={errors.objective?.message}
                        required
                    >
                        <TextInput
                            {...register('objective', {
                                required: 'Objective is required',
                                maxLength: { value: 255, message: 'Maximum 255 characters' },
                            })}
                            placeholder="What was the purpose of this observation? (e.g., Monitor color change during synthesis)"
                            hasError={!!errors.objective}
                        />
                    </FormField>

                    {/* Observers (Users) */}
                    <FormField label="Observers">
                        <Select onChange={handleUserSelect} value="">
                            <option value="">Add an observer...</option>
                            {users?.filter(u => !selectedUserIds?.includes(u.id)).map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.username}
                                </option>
                            ))}
                        </Select>
                        {selectedUserIds && selectedUserIds.length > 0 && (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginTop: 'var(--spacing-sm)' }}>
                                {selectedUserIds.map(userId => {
                                    const user = users?.find(u => u.id === userId);
                                    return (
                                        <span
                                            key={userId}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-xs)',
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--border-radius)',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {user?.full_name || user?.username || `User ${userId}`}
                                            <button
                                                type="button"
                                                onClick={() => removeUser(userId)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: '1rem',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                x
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </FormField>

                    {/* Conditions Section */}
                    <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <legend style={{ fontWeight: 600, padding: '0 var(--spacing-xs)' }}>Process Conditions</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                            <FormField label="Temperature">
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                    <TextInput
                                        type="number"
                                        step="0.1"
                                        {...register('temperature')}
                                        placeholder="80"
                                        style={{ flex: 2 }}
                                    />
                                    <Select {...register('temperature_unit')} style={{ flex: 1 }}>
                                        <option value="°C">°C</option>
                                        <option value="K">K</option>
                                        <option value="°F">°F</option>
                                    </Select>
                                </div>
                            </FormField>
                            <FormField label="Atmosphere">
                                <TextInput
                                    {...register('atmosphere')}
                                    placeholder="N2, air, Ar..."
                                />
                            </FormField>
                            <FormField label="Duration">
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                    <TextInput
                                        type="number"
                                        step="0.1"
                                        {...register('duration')}
                                        placeholder="2"
                                        style={{ flex: 2 }}
                                    />
                                    <Select {...register('duration_unit')} style={{ flex: 1 }}>
                                        <option value="hours">hrs</option>
                                        <option value="minutes">min</option>
                                        <option value="days">days</option>
                                    </Select>
                                </div>
                            </FormField>
                            <FormField label="Pressure (atm)">
                                <TextInput
                                    type="number"
                                    step="0.1"
                                    {...register('pressure')}
                                    placeholder="1.0"
                                />
                            </FormField>
                        </div>
                    </fieldset>

                    {/* Calcination Section (collapsible) */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <button
                            type="button"
                            onClick={() => setShowCalcination(!showCalcination)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                color: 'var(--color-primary)',
                                fontWeight: 500,
                                padding: 0,
                            }}
                        >
                            {showCalcination ? '[-]' : '[+]'} Calcination / Heat Treatment Parameters
                        </button>
                        {showCalcination && (
                            <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                                    <FormField label="Ramp Rate (°C/min)">
                                        <TextInput
                                            type="number"
                                            step="0.1"
                                            {...register('ramp_rate')}
                                            placeholder="5"
                                        />
                                    </FormField>
                                    <FormField label="Target Temp (°C)">
                                        <TextInput
                                            type="number"
                                            step="1"
                                            {...register('target_temperature')}
                                            placeholder="500"
                                        />
                                    </FormField>
                                    <FormField label="Hold Time">
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                            <TextInput
                                                type="number"
                                                step="0.1"
                                                {...register('hold_time')}
                                                placeholder="4"
                                                style={{ flex: 2 }}
                                            />
                                            <Select {...register('hold_unit')} style={{ flex: 1 }}>
                                                <option value="hours">hrs</option>
                                                <option value="minutes">min</option>
                                            </Select>
                                        </div>
                                    </FormField>
                                    <FormField label="Atmosphere">
                                        <TextInput
                                            {...register('calcination_atmosphere')}
                                            placeholder="air, N2..."
                                        />
                                    </FormField>
                                    <FormField label="Cooling Method">
                                        <Select {...register('cooling')}>
                                            <option value="">Select...</option>
                                            <option value="natural">Natural</option>
                                            <option value="forced">Forced</option>
                                            <option value="quench">Quench</option>
                                        </Select>
                                    </FormField>
                                </div>
                            </fieldset>
                        )}
                    </div>

                    {/* Observations Text */}
                    <FormField
                        label="Observations"
                        error={errors.observations_text?.message}
                        required
                    >
                        <TextArea
                            {...register('observations_text', {
                                required: 'Observations are required',
                            })}
                            placeholder="Detailed description of what was observed. Include visual changes, unexpected behaviors, measurements, etc..."
                            rows={6}
                            hasError={!!errors.observations_text}
                        />
                    </FormField>

                    {/* Data Section */}
                    <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <legend style={{ fontWeight: 600, padding: '0 var(--spacing-xs)' }}>Collected Data</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                            <FormField label="Mass Before (g)">
                                <TextInput
                                    type="number"
                                    step="0.001"
                                    {...register('mass_before')}
                                    placeholder="2.5"
                                />
                            </FormField>
                            <FormField label="Mass After (g)">
                                <TextInput
                                    type="number"
                                    step="0.001"
                                    {...register('mass_after')}
                                    placeholder="2.1"
                                />
                            </FormField>
                            <FormField label="Color Before">
                                <TextInput
                                    {...register('color_before')}
                                    placeholder="white"
                                />
                            </FormField>
                            <FormField label="Color After">
                                <TextInput
                                    {...register('color_after')}
                                    placeholder="pale yellow"
                                />
                            </FormField>
                        </div>
                        <FormField label="Additional Notes">
                            <TextInput
                                {...register('notes')}
                                placeholder="Any additional data or notes..."
                            />
                        </FormField>
                    </fieldset>

                    {/* Conclusions */}
                    <FormField
                        label="Conclusions"
                        error={errors.conclusions?.message}
                        required
                    >
                        <TextArea
                            {...register('conclusions', {
                                required: 'Conclusions are required',
                            })}
                            placeholder="What was learned from this observation? What are the implications?"
                            rows={4}
                            hasError={!!errors.conclusions}
                        />
                    </FormField>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(isEditing ? `/observations/${id}` : '/observations')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Save Changes'
                                    : 'Create Observation'}
                        </Button>
                    </div>

                    {/* Error Display */}
                    {(createMutation.error || updateMutation.error) && (
                        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-danger)', color: 'white', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ margin: 0 }}>
                                {createMutation.error?.message || updateMutation.error?.message || 'An error occurred'}
                            </p>
                        </div>
                    )}
                </form>
            </div>

            {/* Help Text */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)', maxWidth: '800px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    Tips for Good Observations
                </h3>
                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <li>Be specific and detailed in your descriptions</li>
                    <li>Include relevant environmental conditions (temperature, humidity, etc.)</li>
                    <li>Note any deviations from expected behavior</li>
                    <li>Record before/after measurements when applicable</li>
                    <li>After creating, you can attach files and link to catalysts/samples from the detail page</li>
                </ul>
            </div>
        </div>
    );
};