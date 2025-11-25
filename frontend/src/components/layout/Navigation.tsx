/**
 * Navigation component - Top-level navigation for the entire application.
 *
 * This component provides the main navigation structure that appears on every
 * page. It's organized by domain (Core, Catalysts) to match the backend
 * structure, making it intuitive for users who understand the domain model.
 *
 * As you add more entities in future phases, you'll add new navigation sections
 * here. The pattern scales well because related entities are grouped together,
 * preventing the navigation from becoming an overwhelming flat list.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
    const location = useLocation();

    /**
     * Helper function to determine if a link is currently active.
     *
     * This checks if the current path starts with the link's path, which means
     * the link is active for both the list page and any detail pages. For example,
     * /catalysts is active for both /catalysts (list) and /catalysts/1 (detail).
     */
    const isActive = (path: string): boolean => {
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="nav">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                        LIMS
                    </Link>

                    <ul className="nav-list">
                        {/* Core domain navigation */}
                        <li>
                            <Link
                                to="/users"
                                className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                            >
                                Users
                            </Link>
                        </li>

                        {/* Catalysts domain navigation */}
                        <li>
                            <Link
                                to="/chemicals"
                                className={`nav-link ${isActive('/chemicals') ? 'active' : ''}`}
                            >
                                Chemicals
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/methods"
                                className={`nav-link ${isActive('/methods') ? 'active' : ''}`}
                            >
                                Methods
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/supports"
                                className={`nav-link ${isActive('/supports') ? 'active' : ''}`}
                            >
                                Supports
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/catalysts"
                                className={`nav-link ${isActive('/catalysts') ? 'active' : ''}`}
                            >
                                Catalysts
                            </Link>
                        </li>

                        {/* TODO: Phase 2 - Add Samples, Characterizations, Observations */}
                        {/* TODO: Phase 3 - Add Experiments, Reactors, Analyzers */}
                        {/* TODO: Phase 4 - Add Contaminants, Carriers, Waveforms, Groups */}
                    </ul>
                </div>
            </div>
        </nav>
    );
};