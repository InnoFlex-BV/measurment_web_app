/**
 * ContaminantFormPage - Form for creating and editing contaminants.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useContaminant, useCreateContaminant, useUpdateContaminant } from '@/hooks/useContaminants.ts';
import { FormField, TextInput, Button } from '@/components/common';
import type { ContaminantCreate } from '@/services/api';

export const ContaminantFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: contaminant, isLoading: isLoadingContaminant } = useContaminant(
        id ? parseInt(id) : undefined
    );

    const createMutation = useCreateContaminant();
    const updateMutation = useUpdateContaminant();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ContaminantCreate>({
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (contaminant) {
            reset({
                name: contaminant.name,
            });
        }
    }, [contaminant, reset]);

    const onSubmit = async (data: ContaminantCreate) => {
        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: { name: data.name },
                });
                navigate(`/contaminants/${id}`);
            } else {
                const newContaminant = await createMutation.mutateAsync(data);
                navigate(`/contaminants/${newContaminant.id}`);
            }
        } catch (error) {
            console.error('Failed to save contaminant:', error);
        }
    };

    if (isEditing && isLoadingContaminant) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading contaminant...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/contaminants"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Contaminants
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Contaminant' : 'Add New Contaminant'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update contaminant information'
                        : 'Add a new target compound for experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Contaminant Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Toluene, Formaldehyde, NOx"
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
                                    ? 'Update Contaminant'
                                    : 'Create Contaminant'}
                        </Button>
                        <Link to="/contaminants">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving contaminant. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
