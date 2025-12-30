/**
 * RelationshipManager - Reusable component for managing many-to-many relationships.
 *
 * This component provides a consistent UI for:
 * - Viewing currently linked items
 * - Adding new links from available items
 * - Removing existing links
 *
 * Used across detail pages for managing relationships like:
 * - Catalyst ↔ Characterizations, Observations, Users
 * - Sample ↔ Characterizations, Observations, Users
 * - Experiment ↔ Samples, Groups, Users
 * etc.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, TextInput } from '@/components/common';

// Generic item type that all linkable entities must satisfy
export interface LinkableItem {
    id: number;
    name?: string;
}

export interface RelationshipManagerProps<T extends LinkableItem> {
    /** Title for the section */
    title: string;
    /** Currently linked items */
    linkedItems: T[];
    /** All available items for linking */
    availableItems: T[];
    /** Loading state for available items */
    isLoadingAvailable?: boolean;
    /** Function to get display name for an item */
    getItemName: (item: T) => string;
    /** Optional function to get secondary text (e.g., type, description) */
    getItemSecondary?: (item: T) => string;
    /** Optional function to get badge info */
    getItemBadge?: (item: T) => { label: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'neutral' } | null;
    /** URL path prefix for item links (e.g., "/characterizations") */
    itemLinkPrefix: string;
    /** Callback when adding a link */
    onAdd: (itemId: number) => void;
    /** Callback when removing a link */
    onRemove: (itemId: number) => void;
    /** Whether add/remove operations are pending */
    isPending?: boolean;
    /** Optional empty state message */
    emptyMessage?: string;
    /** Optional: hide the add section entirely */
    hideAdd?: boolean;
    /** Optional: make items non-clickable (no links) */
    disableLinks?: boolean;
}

export function RelationshipManager<T extends LinkableItem>({
                                                                title,
                                                                linkedItems,
                                                                availableItems,
                                                                isLoadingAvailable = false,
                                                                getItemName,
                                                                getItemSecondary,
                                                                getItemBadge,
                                                                itemLinkPrefix,
                                                                onAdd,
                                                                onRemove,
                                                                isPending = false,
                                                                emptyMessage = 'No items linked yet.',
                                                                hideAdd = false,
                                                                disableLinks = false,
                                                            }: RelationshipManagerProps<T>) {
    const [isAddMode, setIsAddMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Get IDs of currently linked items for filtering
    const linkedIds = useMemo(() => new Set(linkedItems.map(item => item.id)), [linkedItems]);

    // Filter available items to exclude already linked ones and match search
    const unlinkedItems = useMemo(() => {
        let filtered = availableItems.filter(item => !linkedIds.has(item.id));

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const name = getItemName(item).toLowerCase();
                const secondary = getItemSecondary?.(item)?.toLowerCase() || '';
                return name.includes(query) || secondary.includes(query);
            });
        }

        return filtered;
    }, [availableItems, linkedIds, searchQuery, getItemName, getItemSecondary]);

    const handleAdd = (itemId: number) => {
        onAdd(itemId);
        // Don't close add mode to allow multiple additions
    };

    const handleRemove = (itemId: number) => {
        if (window.confirm('Are you sure you want to remove this link?')) {
            onRemove(itemId);
        }
    };

    return (
        <div className="card">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {title} ({linkedItems.length})
                </h3>
                {!hideAdd && (
                    <Button
                        variant={isAddMode ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                            setIsAddMode(!isAddMode);
                            setSearchQuery('');
                        }}
                    >
                        {isAddMode ? 'Done' : '+ Add'}
                    </Button>
                )}
            </div>

            {/* Add Mode - Selection Panel */}
            {isAddMode && !hideAdd && (
                <div style={{
                    marginBottom: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--color-border)',
                }}>
                    <TextInput
                        type="text"
                        placeholder="Search to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 'var(--spacing-sm)' }}
                    />

                    {isLoadingAvailable ? (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Loading available items...
                        </p>
                    ) : unlinkedItems.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {searchQuery ? 'No matching items found.' : 'All items are already linked.'}
                        </p>
                    ) : (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {unlinkedItems.map(item => {
                                const badge = getItemBadge?.(item);
                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                            borderRadius: 'var(--border-radius)',
                                            marginBottom: '2px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        onClick={() => handleAdd(item.id)}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <span style={{
                                                    fontWeight: 500,
                                                    fontSize: '0.875rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {getItemName(item)}
                                                </span>
                                                {badge && (
                                                    <Badge variant={badge.variant} size="sm">
                                                        {badge.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            {getItemSecondary && (
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-secondary)',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {getItemSecondary(item)}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdd(item.id);
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Linked Items List */}
            {linkedItems.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {emptyMessage}
                </p>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
                    {linkedItems.map(item => {
                        const badge = getItemBadge?.(item);
                        const content = (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                        <span style={{
                                            fontWeight: 500,
                                            color: disableLinks ? 'inherit' : 'var(--color-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {getItemName(item)}
                                        </span>
                                        {badge && (
                                            <Badge variant={badge.variant} size="sm">
                                                {badge.label}
                                            </Badge>
                                        )}
                                    </div>
                                    {getItemSecondary && (
                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-secondary)',
                                            margin: '0.125rem 0 0 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {getItemSecondary(item)}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemove(item.id);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        );

                        if (disableLinks) {
                            return <div key={item.id}>{content}</div>;
                        }

                        return (
                            <Link
                                key={item.id}
                                to={`${itemLinkPrefix}/${item.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {content}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default RelationshipManager;
