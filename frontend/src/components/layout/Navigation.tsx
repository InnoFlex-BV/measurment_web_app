/**
 * Navigation component - Top-level navigation for the entire application.
 *
 * Organized by domain:
 * - Core: Users, Files
 * - Catalysts: Chemicals, Methods, Supports, Catalysts, Samples
 * - Characterization: Characterizations, Observations
 * - Experiments: Experiments, Waveforms, Reactors, Analyzers
 * - Reference: Contaminants, Carriers, Groups
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState<string[]>(['experiments']);

    const isActive = (path: string): boolean => {
        return location.pathname.startsWith(path);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isSectionExpanded = (section: string) => expandedSections.includes(section);

    return (
        <nav className="nav">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                        LIMS
                    </Link>

                    <ul className="nav-list">
                        {/* Core domain */}
                        <li>
                            <Link
                                to="/users"
                                className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                            >
                                Users
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/files"
                                className={`nav-link ${isActive('/files') ? 'active' : ''}`}
                            >
                                Files
                            </Link>
                        </li>

                        {/* Divider */}
                        <li style={{ borderLeft: '1px solid var(--color-border)', height: '1.5rem', margin: '0 0.5rem' }} />

                        {/* Catalysts domain */}
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
                        <li>
                            <Link
                                to="/samples"
                                className={`nav-link ${isActive('/samples') ? 'active' : ''}`}
                            >
                                Samples
                            </Link>
                        </li>

                        {/* Divider */}
                        <li style={{ borderLeft: '1px solid var(--color-border)', height: '1.5rem', margin: '0 0.5rem' }} />

                        {/* Characterization domain */}
                        <li>
                            <Link
                                to="/characterizations"
                                className={`nav-link ${isActive('/characterizations') ? 'active' : ''}`}
                            >
                                Characterizations
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/observations"
                                className={`nav-link ${isActive('/observations') ? 'active' : ''}`}
                            >
                                Observations
                            </Link>
                        </li>

                        {/* Divider */}
                        <li style={{ borderLeft: '1px solid var(--color-border)', height: '1.5rem', margin: '0 0.5rem' }} />

                        {/* Experiments domain - highlighted as main feature */}
                        <li>
                            <Link
                                to="/experiments"
                                className={`nav-link ${isActive('/experiments') ? 'active' : ''}`}
                                style={{ fontWeight: 600 }}
                            >
                                Experiments
                            </Link>
                        </li>

                        {/* Dropdown for experiment infrastructure */}
                        <li className="nav-dropdown">
                            <button
                                onClick={() => toggleSection('equipment')}
                                className="nav-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                }}
                            >
                                Equipment
                                <span style={{ fontSize: '0.75rem' }}>{isSectionExpanded('equipment') ? '▲' : '▼'}</span>
                            </button>
                            {isSectionExpanded('equipment') && (
                                <ul className="nav-dropdown-menu">
                                    <li>
                                        <Link
                                            to="/waveforms"
                                            className={`nav-dropdown-link ${isActive('/waveforms') ? 'active' : ''}`}
                                        >
                                            Waveforms
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/reactors"
                                            className={`nav-dropdown-link ${isActive('/reactors') ? 'active' : ''}`}
                                        >
                                            Reactors
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/analyzers"
                                            className={`nav-dropdown-link ${isActive('/analyzers') ? 'active' : ''}`}
                                        >
                                            Analyzers
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Dropdown for reference data */}
                        <li className="nav-dropdown">
                            <button
                                onClick={() => toggleSection('reference')}
                                className="nav-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                }}
                            >
                                Reference
                                <span style={{ fontSize: '0.75rem' }}>{isSectionExpanded('reference') ? '▲' : '▼'}</span>
                            </button>
                            {isSectionExpanded('reference') && (
                                <ul className="nav-dropdown-menu">
                                    <li>
                                        <Link
                                            to="/contaminants"
                                            className={`nav-dropdown-link ${isActive('/contaminants') ? 'active' : ''}`}
                                        >
                                            Contaminants
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/carriers"
                                            className={`nav-dropdown-link ${isActive('/carriers') ? 'active' : ''}`}
                                        >
                                            Carriers
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/groups"
                                            className={`nav-dropdown-link ${isActive('/groups') ? 'active' : ''}`}
                                        >
                                            Groups
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>
            </div>

            {/* Dropdown styles */}
            <style>{`
                .nav-dropdown {
                    position: relative;
                }
                .nav-dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: var(--border-radius);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    list-style: none;
                    padding: 0.5rem 0;
                    margin: 0;
                    min-width: 150px;
                    z-index: 100;
                }
                .nav-dropdown-link {
                    display: block;
                    padding: 0.5rem 1rem;
                    color: var(--color-text);
                    text-decoration: none;
                }
                .nav-dropdown-link:hover {
                    background: var(--color-bg-secondary);
                }
                .nav-dropdown-link.active {
                    color: var(--color-primary);
                    font-weight: 500;
                }
            `}</style>
        </nav>
    );
};
