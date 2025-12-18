/**
 * App - Main application component with routing configuration.
 *
 * Phase 1 includes: Users, Chemicals, Methods, Supports, Catalysts (core)
 * Phase 2 includes: Files, Samples, Characterizations, Observations
 * Phase 3 includes: Waveforms, Reactors, Analyzers, Experiments, Contaminants, Carriers, Groups
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

// Catalyst domain pages (Phase 1 & 2)
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

// Experiments domain pages (Phase 3)
import {
    WaveformListPage,
    WaveformDetailPage,
    WaveformFormPage,
    ReactorListPage,
    ReactorDetailPage,
    ReactorFormPage,
    ProcessedListPage,
    ProcessedDetailPage,
    ProcessedFormPage,
    AnalyzerListPage,
    AnalyzerDetailPage,
    AnalyzerFormPage,
    ExperimentListPage,
    ExperimentDetailPage,
    ExperimentFormPage,
} from '@/pages/experiments';

// Reference domain pages (Phase 3)
import {
    ContaminantListPage,
    ContaminantDetailPage,
    ContaminantFormPage,
    CarrierListPage,
    CarrierDetailPage,
    CarrierFormPage,
    GroupListPage,
    GroupDetailPage,
    GroupFormPage,
} from '@/pages/reference';

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

                        {/* Chemicals */}
                        <Route path="chemicals" element={<ChemicalListPage />} />
                        <Route path="chemicals/new" element={<ChemicalFormPage />} />
                        <Route path="chemicals/:id" element={<ChemicalDetailPage />} />
                        <Route path="chemicals/:id/edit" element={<ChemicalFormPage />} />

                        {/* Methods */}
                        <Route path="methods" element={<MethodListPage />} />
                        <Route path="methods/new" element={<MethodFormPage />} />
                        <Route path="methods/:id" element={<MethodDetailPage />} />
                        <Route path="methods/:id/edit" element={<MethodFormPage />} />

                        {/* Supports */}
                        <Route path="supports" element={<SupportListPage />} />
                        <Route path="supports/new" element={<SupportFormPage />} />
                        <Route path="supports/:id" element={<SupportDetailPage />} />
                        <Route path="supports/:id/edit" element={<SupportFormPage />} />

                        {/* Catalysts */}
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
                        {/* Experiments Domain Routes (Phase 3) */}
                        {/* ============================================= */}

                        {/* Experiments */}
                        <Route path="experiments" element={<ExperimentListPage />} />
                        <Route path="experiments/new" element={<ExperimentFormPage />} />
                        <Route path="experiments/:id" element={<ExperimentDetailPage />} />
                        <Route path="experiments/:id/edit" element={<ExperimentFormPage />} />

                        {/* Waveforms */}
                        <Route path="waveforms" element={<WaveformListPage />} />
                        <Route path="waveforms/new" element={<WaveformFormPage />} />
                        <Route path="waveforms/:id" element={<WaveformDetailPage />} />
                        <Route path="waveforms/:id/edit" element={<WaveformFormPage />} />

                        {/* Reactors */}
                        <Route path="reactors" element={<ReactorListPage />} />
                        <Route path="reactors/new" element={<ReactorFormPage />} />
                        <Route path="reactors/:id" element={<ReactorDetailPage />} />
                        <Route path="reactors/:id/edit" element={<ReactorFormPage />} />

                        {/* Analyzers */}
                        <Route path="analyzers" element={<AnalyzerListPage />} />
                        <Route path="analyzers/new" element={<AnalyzerFormPage />} />
                        <Route path="analyzers/:id" element={<AnalyzerDetailPage />} />
                        <Route path="analyzers/:id/edit" element={<AnalyzerFormPage />} />

                        {/* Processed Results */}
                        <Route path="processed" element={<ProcessedListPage />} />
                        <Route path="processed/new" element={<ProcessedFormPage />} />
                        <Route path="processed/:id" element={<ProcessedDetailPage />} />
                        <Route path="processed/:id/edit" element={<ProcessedFormPage />} />

                        {/* ============================================= */}
                        {/* Reference Domain Routes (Phase 3) */}
                        {/* ============================================= */}

                        {/* Contaminants */}
                        <Route path="contaminants" element={<ContaminantListPage />} />
                        <Route path="contaminants/new" element={<ContaminantFormPage />} />
                        <Route path="contaminants/:id" element={<ContaminantDetailPage />} />
                        <Route path="contaminants/:id/edit" element={<ContaminantFormPage />} />

                        {/* Carriers */}
                        <Route path="carriers" element={<CarrierListPage />} />
                        <Route path="carriers/new" element={<CarrierFormPage />} />
                        <Route path="carriers/:id" element={<CarrierDetailPage />} />
                        <Route path="carriers/:id/edit" element={<CarrierFormPage />} />

                        {/* Groups */}
                        <Route path="groups" element={<GroupListPage />} />
                        <Route path="groups/new" element={<GroupFormPage />} />
                        <Route path="groups/:id" element={<GroupDetailPage />} />
                        <Route path="groups/:id/edit" element={<GroupFormPage />} />

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
