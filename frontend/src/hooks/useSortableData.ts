/**
 * useSortableData - Hook for client-side sorting of table data.
 *
 * Provides sorting functionality for list pages with:
 * - Support for string, number, date, and boolean fields
 * - Ascending/descending toggle
 * - Nested object property access (e.g., 'user.name')
 * - Null/undefined value handling
 */

import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
    key: keyof T | string;
    direction: SortDirection;
}

export interface UseSortableDataResult<T> {
    sortedData: T[];
    sortConfig: SortConfig<T> | null;
    requestSort: (key: keyof T | string) => void;
    getSortDirection: (key: keyof T | string) => SortDirection | null;
}

/**
 * Get a nested property value from an object using dot notation.
 */
function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
        if (acc && typeof acc === 'object' && part in acc) {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);
}

/**
 * Compare two values for sorting.
 */
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
    // Handle null/undefined - push to end
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    let comparison = 0;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
        comparison = a.getTime() - b.getTime();
    }
    // Handle date strings (ISO format)
    else if (typeof a === 'string' && typeof b === 'string' &&
             /^\d{4}-\d{2}-\d{2}/.test(a) && /^\d{4}-\d{2}-\d{2}/.test(b)) {
        comparison = new Date(a).getTime() - new Date(b).getTime();
    }
    // Handle numbers
    else if (typeof a === 'number' && typeof b === 'number') {
        comparison = a - b;
    }
    // Handle numeric strings (e.g., "10.5")
    else if (typeof a === 'string' && typeof b === 'string' &&
             !isNaN(parseFloat(a)) && !isNaN(parseFloat(b)) &&
             /^-?\d+\.?\d*$/.test(a.trim()) && /^-?\d+\.?\d*$/.test(b.trim())) {
        comparison = parseFloat(a) - parseFloat(b);
    }
    // Handle booleans
    else if (typeof a === 'boolean' && typeof b === 'boolean') {
        comparison = a === b ? 0 : a ? -1 : 1;
    }
    // Handle strings (case-insensitive)
    else {
        const strA = String(a).toLowerCase();
        const strB = String(b).toLowerCase();
        comparison = strA.localeCompare(strB);
    }

    return direction === 'asc' ? comparison : -comparison;
}

/**
 * Hook for sorting table data.
 *
 * @param data - Array of items to sort
 * @param defaultSort - Optional default sort configuration
 * @returns Sorted data and sort control functions
 *
 * @example
 * const { sortedData, requestSort, getSortDirection } = useSortableData(users);
 *
 * // In table header:
 * <th onClick={() => requestSort('name')}>
 *   Name {getSortDirection('name') === 'asc' ? '↑' : getSortDirection('name') === 'desc' ? '↓' : ''}
 * </th>
 */
export function useSortableData<T>(
    data: T[] | undefined,
    defaultSort?: SortConfig<T>
): UseSortableDataResult<T> {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSort || null);

    const sortedData = useMemo(() => {
        if (!data) return [];
        if (!sortConfig) return [...data];

        const sorted = [...data].sort((a, b) => {
            const aValue = getNestedValue(a, String(sortConfig.key));
            const bValue = getNestedValue(b, String(sortConfig.key));
            return compareValues(aValue, bValue, sortConfig.direction);
        });

        return sorted;
    }, [data, sortConfig]);

    const requestSort = (key: keyof T | string) => {
        let direction: SortDirection = 'asc';

        if (sortConfig && sortConfig.key === key) {
            // Toggle direction if clicking the same column
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        }

        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: keyof T | string): SortDirection | null => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction;
    };

    return { sortedData, sortConfig, requestSort, getSortDirection };
}