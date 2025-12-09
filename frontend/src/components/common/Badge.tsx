/**
 * Badge component - Small status indicator with various visual styles.
 *
 * Used for displaying status information like "Active", "Depleted",
 * characterization types, or other categorical labels.
 */

import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
        backgroundColor: 'var(--color-primary)',
        color: 'white',
    },
    success: {
        backgroundColor: 'var(--color-success, #10b981)',
        color: 'white',
    },
    warning: {
        backgroundColor: 'var(--color-warning, #f59e0b)',
        color: 'white',
    },
    danger: {
        backgroundColor: 'var(--color-danger, #ef4444)',
        color: 'white',
    },
    info: {
        backgroundColor: 'var(--color-info, #3b82f6)',
        color: 'white',
    },
    neutral: {
        backgroundColor: 'var(--color-bg-secondary, #e5e7eb)',
        color: 'var(--color-text-secondary, #6b7280)',
    },
};

const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
    sm: {
        fontSize: '0.625rem',
        padding: '0.125rem 0.375rem',
    },
    md: {
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
    },
};

export const Badge: React.FC<BadgeProps> = ({
                                                children,
                                                variant = 'default',
                                                size = 'md',
                                                className = '',
                                            }) => {
    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
    };

    return (
        <span className={className} style={baseStyle}>
            {children}
        </span>
    );
};
