/**
 * UserFormPage - Form for creating and editing users.
 *
 * This component demonstrates the standard form pattern that handles both
 * creation and editing of entities. The component determines which mode it's
 * in based on the presence of an ID in the URL. If there's an ID, it fetches
 * the existing user and pre-populates the form for editing. If there's no ID,
 * the form starts empty for creation.
 *
 * React Hook Form manages all form state, validation, and submission. The
 * form integrates with our custom form components and validates against rules
 * that match the backend Pydantic schemas, ensuring data is valid before
 * submission.
 *
 * Type Safety Note: We use UserCreate as the form type because it includes
 * all possible fields (including username which only exists on creation).
 * When submitting for an update, we omit the username field since the backend
 * doesn't accept it in updates.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUser, useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { FormField, TextInput, Button } from '@/components/common';
import type { UserCreate, UserUpdate } from '@/services/api';

export const UserFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    // Fetch existing user if editing
    const { data: user, isLoading: isLoadingUser } = useUser(id ? parseInt(id) : undefined);

    // Get mutation hooks for create and update
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    /**
     * Initialize React Hook Form with UserCreate type.
     *
     * We use UserCreate as the form type because it includes all fields including
     * username. This allows us to handle both creation (which needs username) and
     * editing (which doesn't) with the same form structure.
     */
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<UserCreate>({
        defaultValues: {
            username: '',
            email: '',
            full_name: '',
            is_active: true,
        },
    });

    /**
     * Pre-populate form when editing.
     *
     * When user data loads, we call reset() to update the form's default values.
     * We only set the fields that can be edited - username is omitted because
     * it's immutable after creation.
     */
    useEffect(() => {
        if (user) {
            reset({
                username: '', // Not used when editing, but required by UserCreate type
                email: user.email,
                full_name: user.full_name,
                is_active: user.is_active,
            });
        }
    }, [user, reset]);

    /**
     * Handle form submission.
     *
     * This function determines whether to create or update based on the isEditing
     * flag. When updating, we extract only the fields that UserUpdate accepts,
     * omitting username since it's immutable.
     */
    const onSubmit = async (data: UserCreate) => {
        try {
            if (isEditing && id) {
                // Extract only the fields that can be updated (no username)
                const updateData: UserUpdate = {
                    username: data.username,
                    email: data.email,
                    full_name: data.full_name,
                    is_active: data.is_active,
                };

                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: updateData,
                });
                navigate(`/users/${id}`);
            } else {
                // Create new user with all fields including username
                const newUser = await createMutation.mutateAsync(data);
                navigate(`/users/${newUser.id}`);
            }
        } catch (error) {
            // Error handling is already done by the mutation hooks
            console.error('Form submission error:', error);
        }
    };

    // Show loading state while fetching user for editing
    if (isEditing && isLoadingUser) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading user...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{isEditing ? 'Edit User' : 'Create User'}</h1>
                <p className="page-description">
                    {isEditing ? 'Update user information' : 'Add a new user to the system'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Username field */}
                    <FormField
                        label="Username"
                        name="username"
                        required
                        error={errors.username?.message}
                        helpText="Short identifier, typically matching network login"
                    >
                        <TextInput
                            {...register('username', {
                                required: 'Username is required',
                                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                                pattern: {
                                    value: /^[a-zA-Z0-9_-]+$/,
                                    message: 'Username can only contain letters, numbers, underscores, and hyphens',
                                },
                            })}
                            placeholder="jsmith"
                            hasError={!!errors.username}
                        />
                    </FormField>

                    {/* Full name field */}
                    <FormField
                        label="Full Name"
                        name="full_name"
                        required
                        error={errors.full_name?.message}
                    >
                        <TextInput
                            {...register('full_name', {
                                required: 'Full name is required',
                                minLength: { value: 1, message: 'Full name is required' },
                            })}
                            placeholder="Dr. Jane Smith"
                            hasError={!!errors.full_name}
                        />
                    </FormField>

                    {/* Email field */}
                    <FormField
                        label="Email"
                        name="email"
                        required
                        error={errors.email?.message}
                    >
                        <TextInput
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
                                },
                            })}
                            placeholder="jane.smith@university.edu"
                            hasError={!!errors.email}
                        />
                    </FormField>

                    {/* Active status field */}
                    <FormField
                        label="Status"
                        name="is_active"
                        helpText="Inactive users cannot create new records"
                    >
                        <select
                            className="select"
                            {...register('is_active')}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </FormField>

                    {/* Form actions */}
                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/users')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};