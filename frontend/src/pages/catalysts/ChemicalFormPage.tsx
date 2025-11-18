/**
 * ChemicalFormPage - Form for creating and editing chemicals.
 *
 * This demonstrates the form pattern at its simplest. With only one editable
 * field, the form is straightforward, but it still follows the same create/edit
 * pattern established in UserFormPage. This consistency means you can navigate
 * between entity types without having to learn different interaction patterns.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useChemical, useCreateChemical, useUpdateChemical } from '@/hooks/useChemicals';
import { FormField, TextInput, Button } from '@/components/common';
import type { ChemicalCreate } from '@/services/api';

export const ChemicalFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: chemical, isLoading: isLoadingChemical } = useChemical(id ? parseInt(id) : undefined);
    const createMutation = useCreateChemical();
    const updateMutation = useUpdateChemical();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ChemicalCreate>({
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (chemical) {
            reset({
                name: chemical.name,
            });
        }
    }, [chemical, reset]);

    const onSubmit = async (data: ChemicalCreate) => {
        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data,
                });
                navigate(`/chemicals/${id}`);
            } else {
                const newChemical = await createMutation.mutateAsync(data);
                navigate(`/chemicals/${newChemical.id}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    if (isEditing && isLoadingChemical) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading chemical...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{isEditing ? 'Edit Chemical' : 'Add Chemical'}</h1>
                <p className="page-description">
                    {isEditing ? 'Update chemical information' : 'Add a new chemical compound to the database'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Chemical Name"
                        name="name"
                        required
                        error={errors.name?.message}
                        helpText="Enter the chemical compound name or formula (e.g., 'Titanium Dioxide' or 'TiO₂')"
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Chemical name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Platinum, TiO₂, H₂SO₄"
                            hasError={!!errors.name}
                        />
                    </FormField>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/chemicals')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Add Chemical'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};