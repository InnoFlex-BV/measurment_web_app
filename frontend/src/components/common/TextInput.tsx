/**
 * TextInput - Styled text input component with error state support.
 */

import React, { forwardRef } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ hasError = false, className = '', style, ...props }, ref) => {
        const inputStyles: React.CSSProperties = {
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-bg)',
            border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--border-radius)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            ...style,
        };

        return (
            <input
                ref={ref}
                className={className}
                style={inputStyles}
                {...props}
            />
        );
    }
);

TextInput.displayName = 'TextInput';
