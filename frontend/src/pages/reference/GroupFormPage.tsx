/**
 * GroupFormPage - Form for creating and editing experiment groups.
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useGroup, useCreateGroup, useUpdateGroup } from '@/hooks/useGroups.ts';
import { useFiles } from '@/hooks/useFiles.ts';
import { FormField, TextInput, TextArea, Select, Button } from '@/components/common';
import type { GroupCreate } from '@/services/api';

export const GroupFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: group, isLoading: isLoadingGroup } = useGroup(
        id ? parseInt(id) : undefined
    );

    // Fetch files for discussion file dropdown
    const { data: files } = useFiles({ limit: 100 });

    const createMutation = useCreateGroup();
    const updateMutation = useUpdateGroup();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<GroupCreate>({
        defaultValues: {
            name: '',
            purpose: '',
            method: '',
            conclusion: '',
            discussed_in_id: undefined,
        },
    });

    useEffect(() => {
        if (group) {
            reset({
                name: group.name,
                purpose: group.purpose || '',
                method: group.method || '',
                conclusion: group.conclusion || '',
                discussed_in_id: group.discussed_in_id,
            });
        }
    }, [group, reset]);

    const onSubmit = async (data: GroupCreate) => {
        // Clean up empty strings
        const cleanData: GroupCreate = {
            name: data.name,
            purpose: data.purpose || undefined,
            method: data.method || undefined,
            conclusion: data.conclusion || undefined,
            discussed_in_id: data.discussed_in_id || undefined,
        };

        try {
            if (isEditing && id) {
                await updateMutation.mutateAsync({
                    id: parseInt(id),
                    data: cleanData,
                });
                navigate(`/groups/${id}`);
            } else {
                const newGroup = await createMutation.mutateAsync(cleanData);
                navigate(`/groups/${newGroup.id}`);
            }
        } catch (error) {
            console.error('Failed to save group:', error);
        }
    };

    if (isEditing && isLoadingGroup) {
        return (
            <div className="container">
                <div className="loading-container">
                    <p>Loading group...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <Link
                    to="/groups"
                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Groups
                </Link>
                <h1 className="page-title" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {isEditing ? 'Edit Group' : 'Create New Group'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Update group information'
                        : 'Create a new group to organize related experiments'}
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormField
                        label="Group Name"
                        error={errors.name?.message}
                        required
                    >
                        <TextInput
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 1, message: 'Name cannot be empty' },
                            })}
                            placeholder="e.g., TiO2 Catalyst Comparison, DBD Parameter Study"
                        />
                    </FormField>

                    <FormField
                        label="Purpose"
                        error={errors.purpose?.message}
                        helpText="What is this group for? What question are you trying to answer?"
                    >
                        <TextInput
                            {...register('purpose')}
                            placeholder="e.g., Compare performance of different TiO2 loadings"
                        />
                    </FormField>

                    <FormField
                        label="Method"
                        error={errors.method?.message}
                        helpText="Describe the methodology or approach for this group of experiments"
                    >
                        <TextArea
                            {...register('method')}
                            placeholder="Describe the experimental approach, parameters varied, etc."
                            rows={4}
                        />
                    </FormField>

                    <FormField
                        label="Conclusion"
                        error={errors.conclusion?.message}
                        helpText="Summary of findings from this group of experiments"
                    >
                        <TextArea
                            {...register('conclusion')}
                            placeholder="Key findings and conclusions..."
                            rows={4}
                        />
                    </FormField>

                    <FormField
                        label="Discussion File"
                        error={errors.discussed_in_id?.message}
                        helpText="Link to a report or publication that discusses this group"
                    >
                        <Select
                            {...register('discussed_in_id', {
                                setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
                            })}
                        >
                            <option value="">-- No file selected --</option>
                            {files?.map((file) => (
                                <option key={file.id} value={file.id}>
                                    {file.filename}
                                </option>
                            ))}
                        </Select>
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
                                    ? 'Update Group'
                                    : 'Create Group'}
                        </Button>
                        <Link to="/groups">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>

                    {(createMutation.isError || updateMutation.isError) && (
                        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                            Error saving group. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
