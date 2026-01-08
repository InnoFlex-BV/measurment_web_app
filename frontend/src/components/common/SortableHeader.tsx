/**
 * SortableHeader - Clickable table header for sortable columns.
 *
 * Provides visual feedback for sort state and handles click events
 * to toggle sorting direction.
 */

import React from 'react';
import type { SortDirection } from '@/hooks/useSortableData';

interface SortableHeaderProps {
    label: string;
    sortKey: string;
    currentDirection: SortDirection | null;
    onSort: (key: string) => void;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
    label,
    sortKey,
    currentDirection,
    onSort,
    align = 'left',
    style,
}) => {
    const getSortIndicator = () => {
        if (currentDirection === 'asc') return ' ↑';
        if (currentDirection === 'desc') return ' ↓';
        return '';
    };

    return (
        <th
            onClick={() => onSort(sortKey)}
            style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                textAlign: align,
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                ...style,
            }}
        >
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
            }}>
                {label}
                <span style={{
                    color: currentDirection ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    opacity: currentDirection ? 1 : 0.5,
                    fontSize: '0.75rem',
                    minWidth: '1rem',
                }}>
                    {getSortIndicator() || '↕'}
                </span>
            </span>
        </th>
    );
};