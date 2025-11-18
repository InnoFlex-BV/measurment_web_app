/**
 * Select component - Styled dropdown select for choosing from predefined options.
 *
 * This component is used for fields like selecting a method, choosing active status,
 * or picking from any enumerated set of options. It maintains compatibility with
 * native HTML select behavior and React Hook Form by preserving the standard
 * onChange event signature rather than trying to simplify it.
 *
 * The component uses forwardRef to allow React Hook Form to register it properly,
 * and spreads all standard HTML select attributes to maintain full compatibility
 * with form libraries and native HTML behavior.
 */

import React from 'react';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: SelectOption[];
    hasError?: boolean;
    placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ options, hasError, placeholder, className = '', ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`select ${hasError ? 'input-error' : ''} ${className}`}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }
);

Select.displayName = 'Select';