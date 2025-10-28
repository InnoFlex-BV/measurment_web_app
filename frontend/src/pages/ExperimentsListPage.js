/**
 * Experiments List Page
 *
 * Displays a table of all experiments with filtering options.
 * Demonstrates data fetching patterns, loading states, and conditional rendering.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { experimentsAPI } from '../services/api';
import './ExperimentsListPage.css';

function ExperimentsListPage() {
    // State management for the component
    // Each piece of state tracks a specific aspect of the component's data

    // experiments holds the array of experiment objects from the API
    const [experiments, setExperiments] = useState([]);

    // loading tracks whether we're currently fetching data
    // This lets us show a loading spinner instead of empty content
    const [loading, setLoading] = useState(true);

    // error holds any error message if the API request fails
    // null means no error, a string means there was an error
    const [error, setError] = useState(null);

    // Filter state - these control what experiments are shown
    const [statusFilter, setStatusFilter] = useState('');

    /**
     * Effect hook for fetching experiments data.
     *
     * This effect runs in two scenarios:
     * 1. After the initial render (component mount)
     * 2. Whenever statusFilter changes (user changes the filter)
     *
     * The dependency array [statusFilter] tells React to re-run this effect
     * when statusFilter changes, allowing us to refetch with new filters.
     */
    useEffect(() => {
        // Define an async function inside the effect
        // We can't make the effect callback itself async, so we define
        // an async function inside and call it immediately
        const fetchExperiments = async () => {
            try {
                // Set loading to true before starting the request
                // This triggers a re-render showing the loading state
                setLoading(true);

                // Clear any previous errors
                setError(null);

                // Build the query parameters object
                // Only include status if a filter is selected
                const params = {};
                if (statusFilter) {
                    params.status = statusFilter;
                }

                // Call the API service function
                // This returns a promise that resolves with the data
                // The await keyword pauses execution until the promise resolves
                const data = await experimentsAPI.getAll(params);

                // Update state with the fetched data
                // This triggers a re-render showing the experiments
                setExperiments(data);
            } catch (err) {
                // If anything goes wrong in the try block, we catch the error here
                // This includes network errors, 404s, 500s, etc.
                console.error('Error fetching experiments:', err);

                // Set an error message that will be displayed to the user
                setError('Failed to load experiments. Please try again later.');
            } finally {
                // The finally block runs whether the try succeeded or failed
                // We set loading to false regardless of the outcome
                // This ensures the loading spinner stops in all cases
                setLoading(false);
            }
        };

        // Call the async function we just defined
        // This initiates the data fetching process
        fetchExperiments();
    }, [statusFilter]); // Re-run when statusFilter changes

    /**
     * Handler for status filter change.
     *
     * When the user selects a different status in the dropdown,
     * this function updates the statusFilter state. Because statusFilter
     * is in the useEffect dependency array, changing it triggers a refetch.
     */
    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    /**
     * Format a date string for display.
     *
     * The API returns ISO date strings like "2024-10-20T14:30:00Z"
     * We format them to be human-readable like "Oct 20, 2024 2:30 PM"
     */
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
        } catch (err) {
            // If date parsing fails, return the original string
            return dateString;
        }
    };

    /**
     * Get a CSS class for status badges based on the status value.
     *
     * This creates visual differentiation between statuses using color coding.
     * Each status gets a different color to help users scan the list quickly.
     */
    const getStatusClass = (status) => {
        const statusClasses = {
            'planned': 'status-badge status-planned',
            'in_progress': 'status-badge status-in-progress',
            'completed': 'status-badge status-completed',
            'failed': 'status-badge status-failed',
            'cancelled': 'status-badge status-cancelled',
        };
        return statusClasses[status] || 'status-badge';
    };

    /**
     * Conditional rendering based on component state.
     *
     * React components can return different JSX based on their state.
     * This pattern shows three distinct UIs: loading, error, and success.
     */

    // If loading is true, show a loading spinner
    if (loading) {
        return (
            <div className="experiments-list-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading experiments...</p>
                </div>
            </div>
        );
    }

    // If there's an error, show an error message
    if (error) {
        return (
            <div className="experiments-list-page">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Otherwise, show the experiments list
    // This is the success state where we have data to display
    return (
        <div className="experiments-list-page">
            {/* Page header with title and action button */}
            <div className="page-header">
                <h1>Experiments</h1>
                <Link to="/experiments/new" className="btn btn-primary">
                    Create New Experiment
                </Link>
            </div>

            {/* Filters section */}
            <div className="filters">
                <div className="filter-group">
                    <label htmlFor="status-filter">Status:</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* 
        Conditional rendering for empty state.
        If the experiments array is empty after loading, show a helpful message.
      */}
            {experiments.length === 0 ? (
                <div className="empty-state">
                    <p>No experiments found.</p>
                    {statusFilter && <p>Try changing the filter or create a new experiment.</p>}
                    <Link to="/experiments/new" className="btn btn-primary">
                        Create First Experiment
                    </Link>
                </div>
            ) : (
                // Otherwise show the experiments table
                <div className="table-container">
                    <table className="experiments-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {/*
                Map over the experiments array to create a table row for each one.
                The map function is the standard way to render lists in React.
                Each element gets transformed into JSX.
                
                The key prop is required when rendering lists. React uses keys
                to track which items changed, were added, or removed. This helps
                React optimize re-renders by only updating what changed.
              */}
                        {experiments.map((experiment) => (
                            <tr key={experiment.id}>
                                <td>{experiment.id}</td>
                                <td>
                                    <Link
                                        to={`/experiments/${experiment.id}`}
                                        className="experiment-title-link"
                                    >
                                        {experiment.title}
                                    </Link>
                                </td>
                                <td>{experiment.experiment_type_id}</td>
                                <td>{formatDate(experiment.experiment_date)}</td>
                                <td>
                    <span className={getStatusClass(experiment.status)}>
                      {experiment.status.replace('_', ' ')}
                    </span>
                                </td>
                                <td>{formatDate(experiment.created_at)}</td>
                                <td>
                                    <Link
                                        to={`/experiments/${experiment.id}`}
                                        className="btn btn-small btn-secondary"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ExperimentsListPage;