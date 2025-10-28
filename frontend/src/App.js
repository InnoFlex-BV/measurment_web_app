/**
 * Root App component.
 *
 * This is the top-level component that sets up routing and provides
 * the overall application structure with navigation.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import page components
import HomePage from './pages/HomePage';
import ExperimentsListPage from './pages/ExperimentsListPage';
import ExperimentDetailPage from './pages/ExperimentDetailPage';
import CreateExperimentPage from './pages/CreateExperimentPage';
import ExperimentTypesPage from './pages/ExperimentTypesPage';

/**
 * App component serves as the application shell.
 *
 * It provides:
 * - A navigation header that appears on all pages
 * - Routing configuration mapping URLs to components
 * - Overall layout structure
 */
function App() {
    return (
        <Router>
            <div className="app">
                {/* Navigation header */}
                <header className="app-header">
                    <div className="container">
                        <h1 className="app-title">
                            <Link to="/">Laboratory Data Management</Link>
                        </h1>
                        <nav className="app-nav">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/experiments" className="nav-link">Experiments</Link>
                            <Link to="/experiments/new" className="nav-link">New Experiment</Link>
                            <Link to="/experiment-types" className="nav-link">Experiment Types</Link>
                        </nav>
                    </div>
                </header>

                {/* Main content area where pages render */}
                <main className="app-main">
                    <div className="container">
                        {/*
              Routes component contains all route definitions.
              React Router renders the first Route that matches the current URL.
              
              The Routes component replaces the older Switch component from React Router v5.
              It's more flexible and supports relative routing and nested routes.
            */}
                        <Routes>
                            {/* Home page at root path */}
                            <Route path="/" element={<HomePage />} />

                            {/* Experiments list */}
                            <Route path="/experiments" element={<ExperimentsListPage />} />

                            {/* Create new experiment */}
                            <Route path="/experiments/new" element={<CreateExperimentPage />} />

                            {/* View/edit specific experiment - :id is a URL parameter */}
                            <Route path="/experiments/:id" element={<ExperimentDetailPage />} />

                            {/* Manage experiment types */}
                            <Route path="/experiment-types" element={<ExperimentTypesPage />} />

                            {/* 404 catch-all - matches any path not matched above */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </div>
                </main>

                {/* Footer */}
                <footer className="app-footer">
                    <div className="container">
                        <p>&copy; 2024 Laboratory Data Management System</p>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

/**
 * Simple 404 page component
 */
function NotFoundPage() {
    return (
        <div className="not-found">
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <Link to="/">Return to Home</Link>
        </div>
    );
}

export default App;