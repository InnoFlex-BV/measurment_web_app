/**
 * MethodFormPage - Form for creating and editing synthesis methods.
 *
 * This form introduces the first real complexity in relationship management.
 * Methods have a many-to-many relationship with chemicals, meaning a method
 * can use multiple chemicals, and a chemical can be used in multiple methods.
 *
 * The UI pattern for managing this relationship uses a multi-select approach.
 * We fetch all available chemicals and present them as checkboxes, letting
 * users select which chemicals this method uses. On submission, we send only
 * the IDs of selected chemicals to the API.
 *
 * This pattern—fetch entities to show names, collect selections, submit IDs—is
 * fundamental to relationship management and will appear in every form that
 * manages relationships. Understanding this pattern deeply means you can handle
 * any relationship complexity.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMethod, useCreateMethod, useUpdateMethod } from '@/hooks/useMethods';
import { useChemicals } from '@/hooks/useChemicals';
import { FormField, TextInput, TextArea, Button } from '@/components/common';
import type { MethodCreate } from '@/services/api';

export const MethodFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    // Fetch the method if editing, with chemicals included so we know which to pre-select
    const { data: method, isLoading: isLoadingMethod } = useMethod(
        id ? parseInt(id) : undefined,
        'chemicals'
    );

    // Fetch all chemicals to show as options
    // We fetch without pagination (limit will default to 100) to show all available chemicals
    const { data: allChemicals, isLoading: isLoadingChemicals } = useChemicals();

    const createMutation = useCreateMethod();
    const updateMutation = useUpdateMethod();

    /**
     * State for tracking which chemicals are selected.
     *
     * We manage this as separate state rather than as a form field because
     * the relationship management UI (checkboxes in this case) benefits from
     * having its own state that we can manipulate independently. When the form
     * submits, we include this state in the submission data.
     *
     * The state is an array of chemical IDs representing the current selection.
     */
    const [selectedChemicalIds, setSelectedChemicalIds] = useState<number[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<Omit<MethodCreate, 'chemical_ids'>>({
        defaultValues: {
            descriptive_name: '',
            procedure: '',
            is_active: true,
        },
    });

    /**
     * Pre-populate form when editing.
     *
     * When method data loads, we update both the form fields and the selected
     * chemicals state. This dual update ensures that both the basic fields and
     * the relationship data are restored when editing.
     */
    useEffect(() => {
        if (method) {
            reset({
                descriptive_name: method.descriptive_name,
                procedure: method.procedure,
                is_active: method.is_active,
            });

            // Set selected chemicals based on the method's current chemicals
            // We extract just the IDs from the full chemical objects
            if (method.chemicals) {
                setSelectedChemicalIds(method.chemicals.map(c => c.id));
            }
        }
    }, [method, reset]);

    /**
     * Handle toggling a chemical's selection.
     *
     * This function demonstrates the pattern for managing multi-select state.
     * When a checkbox is clicked, we check if the chemical is currently selected.
     * If it is, we remove it from the selection. If it isn't, we add it.
     *
     * This toggling behavior provides the intuitive "check to select, uncheck to
     * deselect" interaction users expect from checkbox interfaces.
     */
    const handleChemicalToggle = (chemicalId: number) => {
        setSelectedChemicalIds(prev => {
            if (prev.includes(chemicalId)) {
                // Chemical is selected, so remove it
                return prev.filter(id => id !== chemicalId);
            } else {
                // Chemical is not selected, so add it
                return [...prev, chemicalId];
            }
        });
    };

    /**
     * Handle form submission.
     *
     * The key insight here is that we combine the form data with the selected
     * chemical IDs before sending to the API. The form fields give us name,
     * procedure, and is_active. The selectedChemicalIds state gives us the
     * relationship data. We merge these into a complete MethodCreate object.
     */
    const onSubmit = async (data: Omit<MethodCreate, 'chemical_ids'>) => {
        try {
            // Combine form data with selected chemical IDs
            const submitData: MethodCreate = {
                ...data,
                chemical_ids: selectedChemicalIds,
            };

            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: submitData,
                });
                navigate(`/methods/${id}`);
            } else {
                const newMethod = await createMutation.mutateAsync(submitData);
                navigate(`/methods/${newMethod.id}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    // Show loading while fetching data needed for the form
    if (isEditing && isLoadingMethod) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading method...</p>
                </div>
            </div>
        );
    }

    if (isLoadingChemicals) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading chemicals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{isEditing ? 'Edit Method' : 'Create Method'}</h1>
                <p className="page-description">
                    {isEditing ? 'Update synthesis method details' : 'Define a new synthesis procedure'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Method Name"
                        name="descriptive_name"
                        required
                        error={errors.descriptive_name?.message}
                        helpText="A descriptive name that identifies this synthesis method"
                    >
                        <TextInput
                            {...register('descriptive_name', {
                                required: 'Method name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., Sol-Gel Synthesis, Impregnation Method"
                            hasError={!!errors.descriptive_name}
                        />
                    </FormField>

                    <FormField
                        label="Procedure"
                        name="procedure"
                        required
                        error={errors.procedure?.message}
                        helpText="Detailed step-by-step procedure for this synthesis method"
                    >
                        <TextArea
                            {...register('procedure', {
                                required: 'Procedure is required',
                                minLength: { value: 10, message: 'Procedure must be at least 10 characters' },
                            })}
                            placeholder="Describe the synthesis procedure in detail..."
                            rows={10}
                            hasError={!!errors.procedure}
                        />
                    </FormField>

                    <FormField
                        label="Status"
                        name="is_active"
                        helpText="Mark as inactive if this method is deprecated but should be preserved for historical records"
                    >
                        <select
                            className="select"
                            {...register('is_active')}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </FormField>

                    {/* Chemical selection section - this is where relationship management happens */}
                    <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="form-label">Chemicals Used</label>
                            <p className="form-help-text">
                                Select which chemicals are used in this method. You can select multiple chemicals.
                            </p>
                        </div>

                        {allChemicals && allChemicals.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {allChemicals.map(chemical => (
                                    <label
                                        key={chemical.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            cursor: 'pointer',
                                            padding: 'var(--spacing-xs)',
                                            borderRadius: 'var(--radius-sm)',
                                            transition: 'background-color 0.15s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedChemicalIds.includes(chemical.id)}
                                            onChange={() => handleChemicalToggle(chemical.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.875rem' }}>{chemical.name}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                textAlign: 'center',
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    No chemicals available. Please add chemicals before creating methods.
                                </p>
                            </div>
                        )}

                        {selectedChemicalIds.length > 0 && (
                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {selectedChemicalIds.length} chemical{selectedChemicalIds.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/methods')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Create Method'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};