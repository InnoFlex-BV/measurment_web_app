/**
 * App - Main application component with routing configuration.
 *
 * Phase 1 includes: Users (core)
 * Phase 2 includes: Files, Samples, Characterizations, Observations
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Layout
import { Layout } from '@/components/layout/Layout';

// Pages
import { HomePage } from '@/pages/HomePage';

// Core domain pages (Phase 1 & 2)
import {
    UserListPage,
    UserDetailPage,
    UserFormPage,
    FileListPage,
    FileDetailPage,
    FileFormPage,
} from '@/pages/core';

// Catalyst domain pages (Phase 2)
import {
    SampleListPage,
    SampleDetailPage,
    SampleFormPage,
    CharacterizationListPage,
    CharacterizationDetailPage,
    CharacterizationFormPage,
    ObservationListPage,
    ObservationDetailPage,
    ObservationFormPage,
    ChemicalListPage,
    ChemicalDetailPage,
    ChemicalFormPage,
    MethodListPage,
    MethodDetailPage,
    MethodFormPage,
    SupportListPage,
    SupportDetailPage,
    SupportFormPage,
    CatalystListPage,
    CatalystDetailPage,
    CatalystFormPage,
} from '@/pages/catalysts';

// Create a React Query client with sensible defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * Placeholder page for unimplemented routes
 */
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="container">
        <div className="page-header">
            <h1 className="page-title">{title}</h1>
            <p className="page-description">This page is not yet implemented in Phase 2.</p>
        </div>
        <div className="card">
            <p style={{ color: 'var(--color-text-secondary)' }}>
                This entity will be available in a future phase. Use the sidebar to navigate to implemented pages.
            </p>
        </div>
    </div>
);

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        {/* Dashboard */}
                        <Route index element={<HomePage />} />

                        {/* ============================================= */}
                        {/* Core Domain Routes */}
                        {/* ============================================= */}

                        {/* Users */}
                        <Route path="users" element={<UserListPage />} />
                        <Route path="users/new" element={<UserFormPage />} />
                        <Route path="users/:id" element={<UserDetailPage />} />
                        <Route path="users/:id/edit" element={<UserFormPage />} />

                        {/* Files */}
                        <Route path="files" element={<FileListPage />} />
                        <Route path="files/new" element={<FileFormPage />} />
                        <Route path="files/:id" element={<FileDetailPage />} />
                        <Route path="files/:id/edit" element={<FileFormPage />} />

                        {/* ============================================= */}
                        {/* Catalyst Domain Routes */}
                        {/* ============================================= */}

                        {/* Chemicals (placeholder) */}
                        <Route path="chemicals" element={<ChemicalListPage />} />
                        <Route path="chemicals/new" element={<ChemicalFormPage />} />
                        <Route path="chemicals/:id" element={<ChemicalDetailPage />} />
                        <Route path="chemicals/:id/edit" element={<ChemicalFormPage />} />

                        {/* Methods (placeholder) */}
                        <Route path="methods" element={<MethodListPage />} />
                        <Route path="methods/new" element={<MethodFormPage />} />
                        <Route path="methods/:id" element={<MethodDetailPage />} />
                        <Route path="methods/:id/edit" element={<MethodFormPage />} />

                        {/* Supports (placeholder) */}
                        <Route path="supports" element={<SupportListPage />} />
                        <Route path="supports/new" element={<SupportFormPage />} />
                        <Route path="supports/:id" element={<SupportDetailPage />} />
                        <Route path="supports/:id/edit" element={<SupportFormPage />} />

                        {/* Catalysts (placeholder) */}
                        <Route path="catalysts" element={<CatalystListPage />} />
                        <Route path="catalysts/new" element={<CatalystFormPage />} />
                        <Route path="catalysts/:id" element={<CatalystDetailPage />} />
                        <Route path="catalysts/:id/edit" element={<CatalystFormPage />} />

                        {/* Samples */}
                        <Route path="samples" element={<SampleListPage />} />
                        <Route path="samples/new" element={<SampleFormPage />} />
                        <Route path="samples/:id" element={<SampleDetailPage />} />
                        <Route path="samples/:id/edit" element={<SampleFormPage />} />

                        {/* ============================================= */}
                        {/* Characterization Domain Routes */}
                        {/* ============================================= */}

                        {/* Characterizations */}
                        <Route path="characterizations" element={<CharacterizationListPage />} />
                        <Route path="characterizations/new" element={<CharacterizationFormPage />} />
                        <Route path="characterizations/:id" element={<CharacterizationDetailPage />} />
                        <Route path="characterizations/:id/edit" element={<CharacterizationFormPage />} />

                        {/* Observations */}
                        <Route path="observations" element={<ObservationListPage />} />
                        <Route path="observations/new" element={<ObservationFormPage />} />
                        <Route path="observations/:id" element={<ObservationDetailPage />} />
                        <Route path="observations/:id/edit" element={<ObservationFormPage />} />

                        {/* ============================================= */}
                        {/* Experiment Domain Routes (Phase 3 placeholder) */}
                        {/* ============================================= */}
                        <Route path="experiments" element={<PlaceholderPage title="Experiments" />} />

                        {/* Catch-all redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>

            {/* React Query DevTools (only in development) */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default App;
