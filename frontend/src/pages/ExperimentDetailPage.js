/**
 * Experiment Detail Page
 *
 * Displays a single experiment with all its details, measurements, observations, and files.
 * Demonstrates nested data rendering, URL parameters, and complex state management.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { experimentsAPI, measurementsAPI } from '../services/api';
import './ExperimentDetailPage.css';

function ExperimentDetailPage() {
    // Extract the experiment ID from the URL
    // If the URL is /experiments/5, params.id will be '5'
    const { id } = useParams();
    const navigate = useNavigate();

    // State for the experiment data
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the measurements section
    const [showAddMeasurement, setShowAddMeasurement] = useState(false);
    const [newMeasurement, setNewMeasurement] = useState({
        measurement_name: '',
        measurement_value: '',
        unit: '',
        uncertainty: '',
    });

    /**
     * Fetch experiment data when component mounts or ID changes.
     *
     * The dependency array includes id, so if the user navigates from
     * /experiments/5 to /experiments/6, this effect re-runs to fetch
     * the new experiment.
     */
    useEffect(() => {
        const fetchExperiment = async () => {
            try {
                setLoading(true);
                setError(null);

                // Parse ID to number for API call
                const experimentId = parseInt(id);

                // Fetch with full details (measurements, observations, files)
                const data = await experimentsAPI.getById(experimentId, true);
                setExperiment(data);
            } catch (err) {
                console.error('Error fetching experiment:', err);

                if (err.response?.status === 404) {
                    setError('Experiment not found.');
                } else {
                    setError('Failed to load experiment details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchExperiment();
    }, [id]); // Re-run when id changes

    /**
     * Handle adding a new measurement.
     */
    const handleAddMeasurement = async (event) => {
        event.preventDefault();

        try {
            const experimentId = parseInt(id);

            // Prepare measurement data
            const measurementData = {
                measurement_name: newMeasurement.measurement_name,
                measurement_value: parseFloat(newMeasurement.measurement_value),
                unit: newMeasurement.unit,
                uncertainty: newMeasurement.uncertainty ? parseFloat(newMeasurement.uncertainty) : null,
            };

            // Call API to create measurement
            const createdMeasurement = await measurementsAPI.create(experimentId, measurementData);

            // Update local state to show the new measurement
            // We use the functional update pattern to ensure we're working with latest state
            setExperiment(prev => ({
                ...prev,
                measurements: [...(prev.measurements || []), createdMeasurement]
            }));

            // Reset form and hide it
            setNewMeasurement({
                measurement_name: '',
                measurement_value: '',
                unit: '',
                uncertainty: '',
            });
            setShowAddMeasurement(false);
        } catch (err) {
            console.error('Error adding measurement:', err);
            alert('Failed to add measurement. Please try again.');
        }
    };

    /**
     * Handle deleting the experiment.
     */
    const handleDeleteExperiment = async () => {
        // Confirm before deleting
        if (!window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
            return;
        }

        try {
            const experimentId = parseInt(id);
            await experimentsAPI.delete(experimentId);

            // Navigate back to experiments list
            navigate('/experiments');
        } catch (err) {
            console.error('Error deleting experiment:', err);
            alert('Failed to delete experiment. Please try again.');
        }
    };

    /**
     * Format date for display.
     */
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
        } catch (err) {
            return dateString;
        }
    };

    /**
     * Get CSS class for status badge.
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

    // Loading state
    if (loading) {
        return (
            <div className="experiment-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading experiment details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="experiment-detail-page">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <Link to="/experiments" className="btn btn-primary">
                        Back to Experiments
                    </Link>
                </div>
            </div>
        );
    }

    // Success state - render the experiment details
    return (
        <div className="experiment-detail-page">
            {/* Page header with actions */}
            <div className="page-header">
                <div>
                    <Link to="/experiments" className="back-link">
                        ← Back to Experiments
                    </Link>
                    <h1>{experiment.title}</h1>
                    <span className={getStatusClass(experiment.status)}>
            {experiment.status.replace('_', ' ')}
          </span>
                </div>
                <div className="header-actions">
                    <button
                        onClick={handleDeleteExperiment}
                        className="btn btn-danger"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Experiment metadata */}
            <div className="detail-section">
                <h2>Experiment Details</h2>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Experiment ID:</span>
                        <span className="detail-value">{experiment.id}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{experiment.experiment_type_id}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Conducted By:</span>
                        <span className="detail-value">User ID: {experiment.user_id}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Experiment Date:</span>
                        <span className="detail-value">{formatDate(experiment.experiment_date)}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(experiment.created_at)}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Last Updated:</span>
                        <span className="detail-value">{formatDate(experiment.updated_at)}</span>
                    </div>
                </div>

                {experiment.description && (
                    <div className="detail-item full-width">
                        <span className="detail-label">Description:</span>
                        <p className="detail-value">{experiment.description}</p>
                    </div>
                )}
            </div>

            {/* Environmental conditions */}
            {(experiment.temperature_celsius || experiment.pressure_atm || experiment.humidity_percent) && (
                <div className="detail-section">
                    <h2>Environmental Conditions</h2>
                    <div className="detail-grid">
                        {experiment.temperature_celsius && (
                            <div className="detail-item">
                                <span className="detail-label">Temperature:</span>
                                <span className="detail-value">{experiment.temperature_celsius} °C</span>
                            </div>
                        )}
                        {experiment.pressure_atm && (
                            <div className="detail-item">
                                <span className="detail-label">Pressure:</span>
                                <span className="detail-value">{experiment.pressure_atm} atm</span>
                            </div>
                        )}
                        {experiment.humidity_percent && (
                            <div className="detail-item">
                                <span className="detail-label">Humidity:</span>
                                <span className="detail-value">{experiment.humidity_percent}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Measurements section */}
            <div className="detail-section">
                <div className="section-header">
                    <h2>Measurements</h2>
                    <button
                        onClick={() => setShowAddMeasurement(!showAddMeasurement)}
                        className="btn btn-secondary btn-small"
                    >
                        {showAddMeasurement ? 'Cancel' : 'Add Measurement'}
                    </button>
                </div>

                {/* Add measurement form */}
                {showAddMeasurement && (
                    <form onSubmit={handleAddMeasurement} className="add-measurement-form">
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="Measurement name"
                                value={newMeasurement.measurement_name}
                                onChange={(e) => setNewMeasurement(prev => ({
                                    ...prev,
                                    measurement_name: e.target.value
                                }))}
                                required
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Value"
                                value={newMeasurement.measurement_value}
                                onChange={(e) => setNewMeasurement(prev => ({
                                    ...prev,
                                    measurement_value: e.target.value
                                }))}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Unit"
                                value={newMeasurement.unit}
                                onChange={(e) => setNewMeasurement(prev => ({
                                    ...prev,
                                    unit: e.target.value
                                }))}
                                required
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Uncertainty (optional)"
                                value={newMeasurement.uncertainty}
                                onChange={(e) => setNewMeasurement(prev => ({
                                    ...prev,
                                    uncertainty: e.target.value
                                }))}
                            />
                            <button type="submit" className="btn btn-primary btn-small">
                                Add
                            </button>
                        </div>
                    </form>
                )}

                {/* Measurements list */}
                {experiment.measurements && experiment.measurements.length > 0 ? (
                    <div className="measurements-list">
                        {experiment.measurements.map((measurement) => (
                            <div key={measurement.id} className="measurement-card">
                                <div className="measurement-header">
                                    <h4>{measurement.measurement_name}</h4>
                                    <span className="measurement-time">
                    {formatDate(measurement.measured_at)}
                  </span>
                                </div>
                                <div className="measurement-value">
                                    {measurement.measurement_value} {measurement.unit}
                                    {measurement.uncertainty && (
                                        <span className="uncertainty"> ± {measurement.uncertainty}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-message">No measurements recorded yet.</p>
                )}
            </div>

            {/* Observations section */}
            {experiment.observations && experiment.observations.length > 0 && (
                <div className="detail-section">
                    <h2>Observations</h2>
                    <div className="observations-list">
                        {experiment.observations.map((observation) => (
                            <div key={observation.id} className="observation-card">
                                <div className="observation-header">
                  <span className="observation-time">
                    {formatDate(observation.observed_at)}
                  </span>
                                    {observation.observation_type && (
                                        <span className="observation-type">{observation.observation_type}</span>
                                    )}
                                    <span className={`severity-badge severity-${observation.severity}`}>
                    {observation.severity}
                  </span>
                                </div>
                                <p className="observation-text">{observation.observation_text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes section */}
            {experiment.notes && (
                <div className="detail-section">
                    <h2>Notes</h2>
                    <p className="notes-text">{experiment.notes}</p>
                </div>
            )}
        </div>
    );
}

export default ExperimentDetailPage;