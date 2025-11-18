/**
 * HomePage - Landing page and application dashboard.
 *
 * This page serves as the entry point to the application, providing an overview
 * of the system and quick access to major sections. In a production application,
 * you might add statistics, recent activity, or personalized recommendations here.
 *
 * For now, we keep it simple with a welcome message and navigation cards that
 * lead to the main entity management pages. This gives users a clear starting
 * point and helps them understand what the system does.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
    /**
     * Navigation cards configuration.
     *
     * Each card represents a major section of the application with a title,
     * description, and link. This data-driven approach makes it easy to add
     * new sections as the application grows in later phases.
     *
     * The sections are organized to match the domain model, with core entities
     * first followed by catalyst domain entities in a logical workflow order.
     */
    const sections = [
        {
            title: 'Users',
            description: 'Manage research personnel and system users',
            link: '/users',
            icon: '👥',
        },
        {
            title: 'Chemicals',
            description: 'Catalog of chemical compounds used in synthesis',
            link: '/chemicals',
            icon: '⚗️',
        },
        {
            title: 'Methods',
            description: 'Synthesis procedures and protocols',
            link: '/methods',
            icon: '📋',
        },
        {
            title: 'Supports',
            description: 'Substrate materials for catalyst applications',
            link: '/supports',
            icon: '🧱',
        },
        {
            title: 'Catalysts',
            description: 'Synthesized catalyst materials and inventory',
            link: '/catalysts',
            icon: '🔬',
        },
    ];

    return (
        <div className="container">
            {/* Welcome header */}
            <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>
                    Laboratory Information Management System
                </h1>
                <p className="page-description" style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                    Comprehensive platform for managing catalyst research data, from synthesis
                    to characterization and experimental testing
                </p>
            </div>

            {/* System information card */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', backgroundColor: 'var(--color-bg-secondary)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    About This System
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: '1.6', marginBottom: 'var(--spacing-md)' }}>
                    This laboratory data management system provides structured storage and organization
                    for all aspects of catalyst research. Track chemical compounds, document synthesis
                    methods, maintain catalyst inventory, record characterizations, and link everything
                    to experimental results. The system ensures data integrity through validation and
                    maintains complete traceability of material transformations and experimental lineage.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    <strong>Current Phase:</strong> Phase 1 - Core catalyst management with users, chemicals,
                    methods, supports, and catalysts. Future phases will add samples, characterizations,
                    experiments, and advanced analysis capabilities.
                </p>
            </div>

            {/* Navigation cards grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                {sections.map((section) => (
                    <Link
                        key={section.link}
                        to={section.link}
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <div
                            className="card"
                            style={{
                                height: '100%',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                border: '2px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>
                                {section.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-text)' }}>
                                {section.title}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                {section.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick start guide */}
            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                    Getting Started
                </h2>
                <ol style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: '1.8', paddingLeft: 'var(--spacing-lg)' }}>
                    <li>
                        <strong>Add Users:</strong> Create user accounts for research personnel who will use the system
                    </li>
                    <li>
                        <strong>Define Chemicals:</strong> Build your catalog of chemical compounds used in synthesis
                    </li>
                    <li>
                        <strong>Document Methods:</strong> Record synthesis procedures and link them to required chemicals
                    </li>
                    <li>
                        <strong>Register Supports:</strong> Add substrate materials that catalysts can be applied to
                    </li>
                    <li>
                        <strong>Create Catalysts:</strong> Record synthesized catalysts with their methods, properties, and relationships
                    </li>
                </ol>
            </div>
        </div>
    );
};