/**
 * TextInput component - Styled text input that integrates with React Hook Form.
 *
 * This component is registered with React Hook Form using forwardRef, allowing
 * the form library to control the input value and validation. The component
 * handles common input types like text, email, number, and password.
 */

import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
    ({ hasError, className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`text-input ${hasError ? 'input-error' : ''} ${className}`}
                {...props}
            />
        );
    }
);

TextInput.displayName = 'TextInput';