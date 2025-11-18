/**
 * Layout component - Main layout wrapper for all pages.
 *
 * This component provides the consistent structure that appears on every page:
 * navigation at the top, content area in the middle. It uses React Router's
 * Outlet component to render the current page's content.
 *
 * The layout pattern is important for consistency and code reuse. Rather than
 * every page implementing its own navigation and structure, they all inherit
 * this common layout, ensuring the application feels cohesive.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export const Layout: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navigation />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
};