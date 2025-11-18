/**
 * CatalystFormPage - Form for creating and editing catalysts.
 *
 * This form represents the apex of complexity in Phase One because it manages
 * multiple types of relationships simultaneously:
 * - Optional foreign key to method (single selection)
 * - Self-referential many-to-many to other catalysts (multi-selection)
 * - Decimal number fields that need validation
 * - Business logic validation (remaining <= yield)
 *
 * The form demonstrates how these complexity layers compose. Each piece uses
 * patterns we've already established—method selection uses the same dropdown
 * pattern as filtering, input catalyst selection uses the same checkbox pattern
 * as chemical selection in methods, and decimal handling uses text inputs with
 * custom validation. By composing simple patterns, we handle complex requirements
 * without the code becoming unmanageable.
 *
 * The key architectural decision here is managing relationships and form fields
 * independently. React Hook Form handles the basic fields like name and amounts.
 * Separate state handles the method selection and input catalyst selections.
 * This separation makes each piece independently testable and easier to reason
 * about than trying to unify everything into a single form state.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCatalyst, useCatalysts, useCreateCatalyst, useUpdateCatalyst } from '@/hooks/useCatalysts';
import { useMethods } from '@/hooks/useMethods';
import { FormField, TextInput, TextArea, Button } from '@/components/common';
import type { CatalystCreate } from '@/services/api';

export const CatalystFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    /**
     * Fetch the catalyst if editing, with relationships included.
     *
     * We include both method and input_catalysts so we know what to pre-select.
     * The method tells us which method dropdown option to select. The input_catalysts
     * tell us which catalyst checkboxes to check. Including this data upfront avoids
     * the need for additional queries during form initialization.
     */
    const { data: catalyst, isLoading: isLoadingCatalyst } = useCatalyst(
        id ? parseInt(id) : undefined,
        'method,input_catalysts'
    );

    /**
     * Fetch active methods for the dropdown.
     *
     * Researchers typically only select from active methods when creating new
     * catalysts, though historical catalysts might reference inactive methods.
     * This keeps the dropdown focused on current best practices.
     */
    const { data: methods } = useMethods({ is_active: true });

    /**
     * Fetch all catalysts for the input catalyst selection.
     *
     * We fetch all catalysts except the one being edited (if editing) because
     * a catalyst can't be its own input—that would create a circular dependency.
     * This prevents logical errors in the derivation chain.
     *
     * The filter logic happens in the render section where we map catalysts to
     * checkboxes, excluding the current catalyst from the list.
     */
    const { data: allCatalysts } = useCatalysts({});

    const createMutation = useCreateCatalyst();
    const updateMutation = useUpdateCatalyst();

    /**
     * State for relationship management.
     *
     * These state variables track which related entities are selected. They're
     * separate from React Hook Form because relationship management UIs (dropdowns
     * and checkboxes) work more naturally with their own state that gets merged
     * into the form data on submission.
     */
    const [selectedMethodId, setSelectedMethodId] = useState<number | undefined>(undefined);
    const [selectedInputCatalystIds, setSelectedInputCatalystIds] = useState<number[]>([]);

    /**
     * Form data type that explicitly represents form input values.
     *
     * This type is separate from CatalystCreate because forms produce strings
     * from text inputs, while the API accepts number | string. By being explicit
     * about form data being strings, we make TypeScript's type checking more
     * accurate and avoid validation function errors.
     *
     * The amounts are strings here because that's what HTML text inputs produce.
     * We'll convert them appropriately when submitting to the API.
     */
    type CatalystFormData = {
        name: string;
        yield_amount: string;
        remaining_amount: string;
        storage_location: string;
        notes: string;
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<CatalystFormData>({
        defaultValues: {
            name: '',
            yield_amount: '',
            remaining_amount: '',
            storage_location: '',
            notes: '',
        },
    });

    /**
     * Watch yield_amount for validation.
     *
     * React Hook Form's watch function lets you observe field values reactively.
     * We watch yield_amount so we can validate that remaining_amount doesn't
     * exceed it. This dynamic validation provides immediate feedback as users
     * type, preventing invalid states before submission.
     */
    const watchYield = watch('yield_amount');

    /**
     * Pre-populate form when editing.
     *
     * When catalyst data loads, we update both the form fields and the relationship
     * state. This dual update ensures everything is restored correctly. Notice how
     * we handle the method relationship differently from input catalysts—method is
     * a single optional value, while input_catalysts is an array that we map to IDs.
     */
    useEffect(() => {
        if (catalyst) {
            reset({
                name: catalyst.name,
                yield_amount: catalyst.yield_amount,
                remaining_amount: catalyst.remaining_amount,
                storage_location: catalyst.storage_location,
                notes: catalyst.notes || '',
            });

            // Set method if it exists
            setSelectedMethodId(catalyst.method_id || undefined);

            // Set input catalysts if they exist
            if (catalyst.input_catalysts) {
                setSelectedInputCatalystIds(catalyst.input_catalysts.map(c => c.id));
            }
        }
    }, [catalyst, reset]);

    /**
     * Handle toggling an input catalyst selection.
     *
     * This is the same pattern we used for chemical selection in methods—check
     * if the catalyst is currently selected, and either add or remove it from
     * the selection array. The toggling behavior provides the intuitive checkbox
     * interaction users expect.
     */
    const handleInputCatalystToggle = (catalystId: number) => {
        setSelectedInputCatalystIds(prev => {
            if (prev.includes(catalystId)) {
                return prev.filter(id => id !== catalystId);
            } else {
                return [...prev, catalystId];
            }
        });
    };

    /**
     * Handle form submission.
     *
     * This is where we merge the form data with the relationship selections.
     * The form gives us name, amounts, storage, and notes. The component state
     * gives us method_id and input_catalyst_ids. We combine these into a complete
     * CatalystCreate object that matches what the API expects.
     *
     * Notice the type coercion for amounts—we convert the string values from
     * text inputs to the number | string union type that CatalystCreate accepts.
     * The backend handles parsing these strings into Decimal types.
     */
    const onSubmit = async (data: CatalystFormData) => {
        try {
            const submitData: CatalystCreate = {
                name: data.name,
                yield_amount: data.yield_amount, // String from form, API handles conversion
                remaining_amount: data.remaining_amount,
                storage_location: data.storage_location,
                notes: data.notes,
                method_id: selectedMethodId,
                input_catalyst_ids: selectedInputCatalystIds,
            };

            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: submitData,
                });
                navigate(`/catalysts/${id}`);
            } else {
                const newCatalyst = await createMutation.mutateAsync(submitData);
                navigate(`/catalysts/${newCatalyst.id}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    if (isEditing && isLoadingCatalyst) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading catalyst...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{isEditing ? 'Edit Catalyst' : 'Create Catalyst'}</h1>
                <p className="page-description">
                    {isEditing ? 'Update catalyst information and relationships' : 'Record a newly synthesized catalyst'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Basic catalyst information */}
                    <FormField
                        label="Catalyst Name"
                        name="name"
                        required
                        error={errors.name?.message}
                        helpText="Unique identifier or descriptive name for this catalyst"
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Catalyst name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., CAT-001, Pt-TiO2-500C"
                            hasError={!!errors.name}
                        />
                    </FormField>

                    {/* Decimal number fields with custom validation */}
                    <div className="form-grid">
                        <FormField
                            label="Yield Amount (g)"
                            name="yield_amount"
                            required
                            error={errors.yield_amount?.message}
                            helpText="Total amount produced during synthesis"
                        >
                            <TextInput
                                type="text"
                                {...register('yield_amount', {
                                    required: 'Yield amount is required',
                                    validate: (value) => {
                                        const num = parseFloat(value);
                                        if (isNaN(num)) return 'Must be a valid number';
                                        if (num < 0) return 'Must be non-negative';
                                        return true;
                                    }
                                })}
                                placeholder="15.7523"
                                hasError={!!errors.yield_amount}
                            />
                        </FormField>

                        <FormField
                            label="Remaining Amount (g)"
                            name="remaining_amount"
                            required
                            error={errors.remaining_amount?.message}
                            helpText="Current amount available in storage"
                        >
                            <TextInput
                                type="text"
                                {...register('remaining_amount', {
                                    required: 'Remaining amount is required',
                                    validate: (value) => {
                                        const num = parseFloat(value);
                                        if (isNaN(num)) return 'Must be a valid number';
                                        if (num < 0) return 'Must be non-negative';

                                        // Validate that remaining doesn't exceed yield
                                        const yieldNum = parseFloat(watchYield);
                                        if (!isNaN(yieldNum) && num > yieldNum) {
                                            return 'Remaining amount cannot exceed yield amount';
                                        }

                                        return true;
                                    }
                                })}
                                placeholder="15.7523"
                                hasError={!!errors.remaining_amount}
                            />
                        </FormField>
                    </div>

                    <FormField
                        label="Storage Location"
                        name="storage_location"
                        required
                        error={errors.storage_location?.message}
                        helpText="Physical location where this catalyst is stored"
                    >
                        <TextInput
                            {...register('storage_location', {
                                required: 'Storage location is required',
                                minLength: { value: 1, message: 'Storage location cannot be empty' },
                            })}
                            placeholder="e.g., Freezer A, Shelf 2, Box 3"
                            hasError={!!errors.storage_location}
                        />
                    </FormField>

                    <FormField
                        label="Notes"
                        name="notes"
                        helpText="Optional observations about synthesis, appearance, or handling"
                    >
                        <TextArea
                            {...register('notes')}
                            placeholder="Record any observations about the synthesis process, appearance, or special handling requirements..."
                            hasError={!!errors.notes}
                        />
                    </FormField>

                    {/* Relationship management section */}
                    <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                            Synthesis Information
                        </h3>

                        {/* Method selection - optional foreign key */}
                        <FormField
                            label="Synthesis Method"
                            name="method_id"
                            helpText="The procedure used to create this catalyst (optional)"
                        >
                            <select
                                className="select"
                                value={selectedMethodId || ''}
                                onChange={(e) => setSelectedMethodId(e.target.value ? parseInt(e.target.value) : undefined)}
                            >
                                <option value="">No method specified</option>
                                {methods?.map(method => (
                                    <option key={method.id} value={method.id}>
                                        {method.descriptive_name}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        {/* Input catalyst selection - self-referential many-to-many */}
                        <div style={{ marginTop: 'var(--spacing-lg)' }}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Input Catalysts</label>
                                <p className="form-help-text">
                                    If this catalyst was derived from other catalysts (e.g., through calcination or modification),
                                    select the parent catalysts that were used as inputs.
                                </p>
                            </div>

                            {allCatalysts && allCatalysts.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    {allCatalysts
                                        .filter(c => !isEditing || c.id !== parseInt(id!)) // Exclude self when editing
                                        .map(inputCatalyst => (
                                            <label
                                                key={inputCatalyst.id}
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
                                                    checked={selectedInputCatalystIds.includes(inputCatalyst.id)}
                                                    onChange={() => handleInputCatalystToggle(inputCatalyst.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.875rem' }}>
                          {inputCatalyst.name}
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: 'var(--spacing-xs)' }}>
                            ({inputCatalyst.remaining_amount}g remaining)
                          </span>
                        </span>
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
                                        No other catalysts available. This will be the first catalyst in the database.
                                    </p>
                                </div>
                            )}

                            {selectedInputCatalystIds.length > 0 && (
                                <div style={{ marginTop: 'var(--spacing-md)' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {selectedInputCatalystIds.length} input catalyst{selectedInputCatalystIds.length !== 1 ? 's' : ''} selected
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/catalysts')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Create Catalyst'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};