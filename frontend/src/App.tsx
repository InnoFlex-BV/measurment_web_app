/**
 * App.tsx - Main application component with routing configuration.
 *
 * This component sets up the entire routing structure for the application using
 * React Router v6. The routing configuration follows a hierarchical pattern that
 * mirrors the application's information architecture.
 *
 * The route structure uses nested routes with the Layout component at the root.
 * This means every page gets wrapped with the Layout automatically, ensuring
 * consistent navigation without repeating the Layout in every page component.
 *
 * Routes are organized by domain (core, catalysts) to maintain clarity as the
 * application grows. Each entity follows the same URL pattern:
 * - /{entity}          - List all entities
 * - /{entity}/new      - Create new entity
 * - /{entity}/:id      - View entity detail
 * - /{entity}/:id/edit - Edit entity
 *
 * This consistency makes the application intuitive because users can predict
 * URLs and navigation patterns once they understand any one entity type.
 */

// import React from 'react'; TODO: maybe uncomment
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout component that wraps all pages
import { Layout } from './components/layout/Layout';

// Page components organized by domain
import { HomePage } from './pages/HomePage';

// Core domain pages
import { UserListPage } from './pages/core/UserListPage';
import { UserDetailPage } from './pages/core/UserDetailPage';
import { UserFormPage } from './pages/core/UserFormPage';

// Catalyst domain pages
import { ChemicalListPage } from './pages/catalysts/ChemicalListPage';
import { ChemicalDetailPage } from './pages/catalysts/ChemicalDetailPage';
import { ChemicalFormPage } from './pages/catalysts/ChemicalFormPage';

import { MethodListPage } from './pages/catalysts/MethodListPage';
import { MethodDetailPage } from './pages/catalysts/MethodDetailPage';
import { MethodFormPage } from './pages/catalysts/MethodFormPage';

import { SupportListPage } from './pages/catalysts/SupportListPage';
import { SupportDetailPage } from './pages/catalysts/SupportDetailPage';
import { SupportFormPage } from './pages/catalysts/SupportFormPage';

import { CatalystListPage } from './pages/catalysts/CatalystListPage';
import { CatalystDetailPage } from './pages/catalysts/CatalystDetailPage';
import { CatalystFormPage } from './pages/catalysts/CatalystFormPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 
          Root route with Layout wrapper.
          
          All child routes render inside the Layout's <Outlet />, which means
          they automatically get the navigation and overall page structure.
          This pattern eliminates duplication and ensures consistency.
        */}
                <Route path="/" element={<Layout />}>
                    {/* Home page at root URL */}
                    <Route index element={<HomePage />} />

                    {/* 
            User routes (Core domain).
            
            The user management routes demonstrate the standard entity pattern.
            Notice how the structure is consistent: list, new, detail, edit.
            This pattern repeats for every entity type, creating predictability.
          */}
                    <Route path="users">
                        <Route index element={<UserListPage />} />
                        <Route path="new" element={<UserFormPage />} />
                        <Route path=":id" element={<UserDetailPage />} />
                        <Route path=":id/edit" element={<UserFormPage />} />
                    </Route>

                    {/* 
            Chemical routes (Catalyst domain).
            
            Chemicals follow the exact same pattern as users. The consistency
            means once you understand one entity's routing, you understand them
            all. This reduces cognitive load for both users and developers.
          */}
                    <Route path="chemicals">
                        <Route index element={<ChemicalListPage />} />
                        <Route path="new" element={<ChemicalFormPage />} />
                        <Route path=":id" element={<ChemicalDetailPage />} />
                        <Route path=":id/edit" element={<ChemicalFormPage />} />
                    </Route>

                    {/* Method routes (Catalyst domain) */}
                    <Route path="methods">
                        <Route index element={<MethodListPage />} />
                        <Route path="new" element={<MethodFormPage />} />
                        <Route path=":id" element={<MethodDetailPage />} />
                        <Route path=":id/edit" element={<MethodFormPage />} />
                    </Route>

                    {/* Support routes (Catalyst domain) */}
                    <Route path="supports">
                        <Route index element={<SupportListPage />} />
                        <Route path="new" element={<SupportFormPage />} />
                        <Route path=":id" element={<SupportDetailPage />} />
                        <Route path=":id/edit" element={<SupportFormPage />} />
                    </Route>

                    {/* Catalyst routes (Catalyst domain) */}
                    <Route path="catalysts">
                        <Route index element={<CatalystListPage />} />
                        <Route path="new" element={<CatalystFormPage />} />
                        <Route path=":id" element={<CatalystDetailPage />} />
                        <Route path=":id/edit" element={<CatalystFormPage />} />
                    </Route>

                    {/* 
            Catch-all route for 404 handling.
            
            Any URL that doesn't match the routes above redirects to home.
            In a production application, you might create a dedicated 404 page
            with helpful messages and navigation options. For now, redirecting
            to home ensures users never hit a dead end.
          */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;