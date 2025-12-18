/**
 * Layout - Main application layout with navigation sidebar.
 *
 * Phase 1: Users, Chemicals, Methods, Supports, Catalysts
 * Phase 2: Files, Samples, Characterizations, Observations
 * Phase 3: Experiments, Waveforms, Reactors, Analyzers, Contaminants, Carriers, Groups
 */

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'block',
    padding: '0.5rem 1rem',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
    backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
    textDecoration: 'none',
    borderRadius: 'var(--border-radius)',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 400,
    transition: 'background-color 0.2s',
});

// const subNavLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
//     ...navLinkStyle({ isActive }),
//     paddingLeft: '1.5rem',
//     fontSize: '0.8125rem',
// });

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text-secondary)',
    padding: '1rem 1rem 0.25rem',
    marginTop: '0.5rem',
};

export const Layout: React.FC = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: '220px',
                    backgroundColor: 'var(--color-bg)',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    overflowY: 'auto',
                }}
            >
                {/* Logo / Brand */}
                <div
                    style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    <NavLink to="/" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                        <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                            🧪 Chem Lab LIMS
                        </h1>
                    </NavLink>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '0.5rem' }}>
                    <NavLink to="/" style={navLinkStyle} end>
                        Dashboard
                    </NavLink>

                    {/* Core Section */}
                    <div style={sectionTitleStyle}>Core</div>
                    <NavLink to="/users" style={navLinkStyle}>
                        Users
                    </NavLink>
                    <NavLink to="/files" style={navLinkStyle}>
                        Files
                    </NavLink>

                    {/* Catalyst Section */}
                    <div style={sectionTitleStyle}>Catalysts</div>
                    <NavLink to="/chemicals" style={navLinkStyle}>
                        Chemicals
                    </NavLink>
                    <NavLink to="/methods" style={navLinkStyle}>
                        Methods
                    </NavLink>
                    <NavLink to="/supports" style={navLinkStyle}>
                        Supports
                    </NavLink>
                    <NavLink to="/catalysts" style={navLinkStyle}>
                        Catalysts
                    </NavLink>
                    <NavLink to="/samples" style={navLinkStyle}>
                        Samples
                    </NavLink>

                    {/* Characterization Section */}
                    <div style={sectionTitleStyle}>Analysis</div>
                    <NavLink to="/characterizations" style={navLinkStyle}>
                        Characterizations
                    </NavLink>
                    <NavLink to="/observations" style={navLinkStyle}>
                        Observations
                    </NavLink>

                    {/* Experiments Section (Phase 3) */}
                    <div style={sectionTitleStyle}>Experiments</div>
                    <NavLink to="/experiments" style={navLinkStyle}>
                        Experiments
                    </NavLink>
                    <NavLink to="/groups" style={navLinkStyle}>
                        Groups
                    </NavLink>
                    <NavLink to="/processed" style={navLinkStyle}>
                        Results
                    </NavLink>

                    {/* Equipment Section (Phase 3) */}
                    <div style={sectionTitleStyle}>Equipment</div>
                    <NavLink to="/waveforms" style={navLinkStyle}>
                        Waveforms
                    </NavLink>
                    <NavLink to="/reactors" style={navLinkStyle}>
                        Reactors
                    </NavLink>
                    <NavLink to="/analyzers" style={navLinkStyle}>
                        Analyzers
                    </NavLink>

                    {/* Reference Data Section (Phase 3) */}
                    <div style={sectionTitleStyle}>Reference</div>
                    <NavLink to="/contaminants" style={navLinkStyle}>
                        Contaminants
                    </NavLink>
                    <NavLink to="/carriers" style={navLinkStyle}>
                        Carriers
                    </NavLink>
                </nav>

                {/* Footer */}
                <div
                    style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    Phase 3
                </div>
            </aside>

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    marginLeft: '220px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};
