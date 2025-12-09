/**
 * Button - Reusable button component with variant and size support.
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  children,
                                                  className = '',
                                                  style,
                                                  ...props
                                              }) => {
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--border-radius)',
        fontWeight: 500,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        border: 'none',
        transition: 'background-color 0.2s, opacity 0.2s',
    };

    // Size styles
    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: {
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
        },
        md: {
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
        },
        lg: {
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
        },
    };

    // Variant styles
    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: 'var(--color-primary)',
            color: 'white',
        },
        secondary: {
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
        },
        danger: {
            backgroundColor: 'var(--color-danger)',
            color: 'white',
        },
    };

    const combinedStyles: React.CSSProperties = {
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
    };

    return (
        <button className={className} style={combinedStyles} {...props}>
            {children}
        </button>
    );
};
