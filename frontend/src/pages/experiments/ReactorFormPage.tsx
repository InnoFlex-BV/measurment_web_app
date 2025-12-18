/**
 * ReactorFormPage - Form for creating and editing reactors.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useReactor, useCreateReactor, useUpdateReactor } from '@/hooks/useReactors';
import { FormField, TextInput, TextArea, Button } from '@/components/common';
import type { ReactorCreate } from '@/services/api';

export const ReactorFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: reactor, isLoading: isLoadingReactor } = useReactor(
        id ? parseInt(id) : undefined
    );

    const createMutation = useCreateReactor();
    const updateMutation = useUpdateReactor();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ReactorCreate>({
        defaultValues: {
            description: '',
            volume: '',
        },
    });

    useEffect(() => {
        if (reactor) {
            reset({
                description: reactor.description || '',
                volume: reactor.volume || '',
            });
        }
    }, [reactor, reset]);

    const onSubmit = async (data: ReactorCreate) => {
        // Clean up empty strings to undefined
        const cleanData: ReactorCreate = {
            description: data.description || undefined,
            volume: data.volume || undefined,
        };

        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: cleanData,
                });
                navigate(`/reactors/${id}`);
            } else {
                const newReactor = await createMutation.mutateAsync(cleanData);
                navigate(`/reactors/${newReactor.id}`);
            }
        } catch (error) {
            console.error('Failed to save reactor:', error);
        }
    };

    if (isEditing && isLoadingReactor) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading reactor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/reactors"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Reactors
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Reactor' : 'Add New Reactor'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update reactor information'
                        : 'Add a new reactor vessel for experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Description"
                        error={errors.description?.message}
                        helpText="Detailed description of the reactor design and configuration"
                    >
                        <TextArea
                            {...register('description')}
                            placeholder="e.g., Quartz DBD reactor, 10mm gap, powered electrode 50mm diameter, mesh ground electrode, gas inlet/outlet on sides"
                            rows={4}
                        />
                    </FormField>

                    <FormField
                        label="Volume (mL)"
                        error={errors.volume?.message}
                        helpText="Reactor volume for calculating GHSV, residence time, etc."
                    >
                        <TextInput
                            {...register('volume', {
                                validate: (v) => !v || !isNaN(parseFloat(v)) || 'Must be a number',
                            })}
                            placeholder="e.g., 25.5"
                        />
                    </FormField>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isSubmitting || createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Reactor'
                                    : 'Create Reactor'}
                        </Button>
                        <Link to="/reactors">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving reactor. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};