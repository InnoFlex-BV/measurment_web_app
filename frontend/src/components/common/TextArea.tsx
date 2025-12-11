/**
 * TextArea - Styled textarea component with error state support.
 */

import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ hasError = false, className = '', style, ...props }, ref) => {
        const textareaStyles: React.CSSProperties = {
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
            resize: 'vertical',
            minHeight: '80px',
            fontFamily: 'inherit',
            ...style,
        };

        return (
            <textarea
                ref={ref}
                className={className}
                style={textareaStyles}
                {...props}
            />
        );
    }
);

TextArea.displayName = 'TextArea';
