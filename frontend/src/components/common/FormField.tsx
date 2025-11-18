/**
 * FormField component - Reusable form field with label, input, and error display.
 *
 * This component wraps form inputs with consistent styling and error handling.
 * It integrates with React Hook Form to display validation errors automatically.
 * The component is generic enough to work with any input type while providing
 * a consistent look and feel across all forms.
 */

import React from 'react';

interface FormFieldProps {
    label: string;
    name: string;
    error?: string;
    required?: boolean;
    helpText?: string;
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
        <div className="form-field">
            <label htmlFor={name} className="form-label">
                {label}
                {required && <span className="required-indicator">*</span>}
            </label>

            {helpText && (
                <p className="form-help-text">{helpText}</p>
            )}

            <div className="form-input-wrapper">
                {children}
            </div>

            {error && (
                <p className="form-error">{error}</p>
            )}
        </div>
    );
};