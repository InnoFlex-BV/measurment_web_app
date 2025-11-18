/**
 * SupportFormPage - Form for creating and editing supports.
 *
 * This form adds a text area for the description field, demonstrating how
 * optional fields are handled. The description uses our TextArea component
 * which automatically provides multi-line input with appropriate sizing.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSupport, useCreateSupport, useUpdateSupport } from '@/hooks/useSupports';
import { FormField, TextInput, TextArea, Button } from '@/components/common';
import type { SupportCreate } from '@/services/api';

export const SupportFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: support, isLoading: isLoadingSupport } = useSupport(id ? parseInt(id) : undefined);
    const createMutation = useCreateSupport();
    const updateMutation = useUpdateSupport();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SupportCreate>({
        defaultValues: {
            descriptive_name: '',
            description: '',
        },
    });

    useEffect(() => {
        if (support) {
            reset({
                descriptive_name: support.descriptive_name,
                description: support.description || '',
            });
        }
    }, [support, reset]);

    const onSubmit = async (data: SupportCreate) => {
        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data,
                });
                navigate(`/supports/${id}`);
            } else {
                const newSupport = await createMutation.mutateAsync(data);
                navigate(`/supports/${newSupport.id}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    if (isEditing && isLoadingSupport) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading support...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{isEditing ? 'Edit Support' : 'Add Support'}</h1>
                <p className="page-description">
                    {isEditing ? 'Update support material information' : 'Add a new support material to the database'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Support Name"
                        name="descriptive_name"
                        required
                        error={errors.descriptive_name?.message}
                        helpText="Enter the support material name with relevant specifications (e.g., 'γ-Alumina 200 m²/g')"
                    >
                        <TextInput
                            {...register('descriptive_name', {
                                required: 'Support name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Silica Gel, Activated Carbon, γ-Alumina"
                            hasError={!!errors.descriptive_name}
                        />
                    </FormField>

                    <FormField
                        label="Description"
                        name="description"
                        error={errors.description?.message}
                        helpText="Optional: Add detailed specifications, properties, or notes about this support material"
                    >
                        <TextArea
                            {...register('description')}
                            placeholder="Enter physical properties, surface area, pore size, manufacturer details, etc."
                            hasError={!!errors.description}
                        />
                    </FormField>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/supports')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Add Support'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};