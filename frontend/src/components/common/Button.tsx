/**
 * Button - Reusable button component with variant, size, and loading support.
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

/**
 * Simple loading spinner component
 */
const LoadingSpinner: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
    const spinnerSize = size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px';

    return (
        <span
            style={{
                display: 'inline-block',
                width: spinnerSize,
                height: spinnerSize,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'button-spin 0.6s linear infinite',
                marginRight: '0.5rem',
            }}
        />
    );
};

export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  isLoading = false,
                                                  children,
                                                  className = '',
                                                  style,
                                                  disabled,
                                                  ...props
                                              }) => {
    const isDisabled = disabled || isLoading;

    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--border-radius)',
        fontWeight: 500,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
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
        <button
            className={className}
            style={combinedStyles}
            disabled={isDisabled}
            {...props}
        >
            {isLoading && <LoadingSpinner size={size} />}
            {children}
        </button>
    );
};
