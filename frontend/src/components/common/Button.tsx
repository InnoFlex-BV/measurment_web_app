/**
 * Button component - Styled button with variants for different actions.
 *
 * The component supports different visual variants (primary, secondary, danger)
 * to communicate the button's purpose and importance. Loading states disable
 * interaction and show visual feedback during async operations.
 */

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  variant = 'primary',
                                                  isLoading = false,
                                                  fullWidth = false,
                                                  className = '',
                                                  disabled,
                                                  ...props
                                              }) => {
    return (
        <button
            className={clsx(
                'button',
                `button-${variant}`,
                {
                    'button-loading': isLoading,
                    'button-full-width': fullWidth,
                },
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="button-loader">Loading...</span>
            ) : (
                children
            )}
        </button>
    );
};