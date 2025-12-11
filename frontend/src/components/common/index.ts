/**
 * Central export for all common UI components.
 *
 * This index file allows importing multiple components from a single path:
 * import { Button, TextInput, FormField, Badge } from '@/components/common';
 *
 * Type interfaces are also exported for external typing:
 * import type { ButtonProps, BadgeProps } from '@/components/common';
 */

// Component exports
export { FormField } from './FormField';
export { TextInput } from './TextInput';
export { TextArea } from './TextArea';
export { Select } from './Select';
export { Button } from './Button';
export { Badge } from './Badge';

// Type exports
export type { FormFieldProps } from './FormField';
export type { TextInputProps } from './TextInput';
export type { TextAreaProps } from './TextArea';
export type { SelectProps } from './Select';
export type { ButtonProps } from './Button';
export type { BadgeProps, BadgeVariant } from './Badge';
