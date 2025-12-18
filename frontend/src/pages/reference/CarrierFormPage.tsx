/**
 * CarrierFormPage - Form for creating and editing carriers.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCarrier, useCreateCarrier, useUpdateCarrier } from '@/hooks/useCarriers.ts';
import { FormField, TextInput, Button } from '@/components/common';
import type { CarrierCreate } from '@/services/api';

export const CarrierFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: carrier, isLoading: isLoadingCarrier } = useCarrier(
        id ? parseInt(id) : undefined
    );

    const createMutation = useCreateCarrier();
    const updateMutation = useUpdateCarrier();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CarrierCreate>({
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (carrier) {
            reset({
                name: carrier.name,
            });
        }
    }, [carrier, reset]);

    const onSubmit = async (data: CarrierCreate) => {
        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: { name: data.name },
                });
                navigate(`/carriers/${id}`);
            } else {
                const newCarrier = await createMutation.mutateAsync(data);
                navigate(`/carriers/${newCarrier.id}`);
            }
        } catch (error) {
            console.error('Failed to save carrier:', error);
        }
    };

    if (isEditing && isLoadingCarrier) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading carrier...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/carriers"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Carriers
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Carrier' : 'Add New Carrier'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update carrier gas information'
                        : 'Add a new carrier gas for experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Carrier Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., N2, Ar, Air, He"
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
                                    ? 'Update Carrier'
                                    : 'Create Carrier'}
                        </Button>
                        <Link to="/carriers">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving carrier. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};