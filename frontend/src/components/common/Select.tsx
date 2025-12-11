/**
 * Select component - Styled dropdown that integrates with React Hook Form.
 *
 * This component is registered with React Hook Form using forwardRef, allowing
 * the form library to control the select value and validation.
 */

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ hasError, className = '', children, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`select ${hasError ? 'input-error' : ''} ${className}`}
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border, #d1d5db)'}`,
                    borderRadius: 'var(--border-radius, 0.375rem)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                }}
                {...props}
            >
                {children}
            </select>
        );
    }
);

Select.displayName = 'Select';
