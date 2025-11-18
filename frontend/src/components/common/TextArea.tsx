/**
 * TextArea component - Styled textarea for multi-line text input.
 *
 * Used for fields like method procedures, catalyst notes, or support descriptions
 * where users need to enter multiple lines of text. The component automatically
 * sizes to fit content up to a maximum height.
 */

import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ hasError, className = '', ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`textarea ${hasError ? 'input-error' : ''} ${className}`}
                rows={5}
                {...props}
            />
        );
    }
);

TextArea.displayName = 'TextArea';