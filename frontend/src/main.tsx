import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { queryClient } from './services/queryClient';
import './index.css';

/**
 * Application entry point.
 *
 * The QueryClientProvider makes React Query available throughout the
 * component tree. The ReactQueryDevtools provide a debugging interface
 * that shows query status, cached data, and network activity. This is
 * invaluable during development for understanding what data is being
 * fetched and when.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            {/* React Query Devtools only appear in development */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </React.StrictMode>
);