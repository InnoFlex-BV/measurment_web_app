/**
 * FormField - Wrapper component for form inputs with label, error, and help text display.
 */

import React from 'react';

export interface FormFieldProps {
    label: string;
    name?: string;  // Optional - used for htmlFor on label
    error?: string;
    required?: boolean;
    helpText?: string;  // Optional helper text shown below input
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
                                                        label,
                                                        name,
                                                        error,
                                                        required = false,
                                                        helpText,
                                                        children,
                                                    }) => {
    return (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
                htmlFor={name}
                className="form-label"
                style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-text)',
                }}
            >
                {label}
                {required && (
                    <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>
                )}
            </label>
            {children}
            {helpText && !error && (
                <p
                    style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    {helpText}
                </p>
            )}
            {error && (
                <p
                    style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--color-danger)',
                    }}
                >
                    {error}
                </p>
            )}
        </div>
    );
};
