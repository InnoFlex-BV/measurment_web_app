/**
 * Create Experiment Page
 *
 * Form for creating a new experiment with validation and error handling.
 * Demonstrates controlled components, form submission, and navigation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { experimentsAPI, experimentTypesAPI } from '../services/api';
import './CreateExperimentPage.css';

function CreateExperimentPage() {
    // useNavigate hook provides programmatic navigation
    // After creating an experiment, we'll use this to redirect to the detail page
    const navigate = useNavigate();

    /**
     * Form state - each field has its own state variable.
     *
     * This is the controlled component pattern where React state
     * is the single source of truth for all form values.
     */
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        experiment_type_id: '',
        user_id: 1, // Hardcoded for now - would come from auth context in real app
        experiment_date: '',
        temperature_celsius: '',
        pressure_atm: '',
        humidity_percent: '',
        status: 'planned',
        notes: '',
    });

    // State for experiment types dropdown options
    const [experimentTypes, setExperimentTypes] = useState([]);

    // State for form submission
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // State for field-level validation errors
    const [validationErrors, setValidationErrors] = useState({});

    /**
     * Fetch experiment types for the dropdown when component mounts.
     *
     * We only want to fetch once, so the dependency array is empty.
     */
    useEffect(() => {
        const fetchExperimentTypes = async () => {
            try {
                const types = await experimentTypesAPI.getAll();
                setExperimentTypes(types);

                // If there are types, set the first one as default
                if (types.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        experiment_type_id: types[0].id
                    }));
                }
            } catch (err) {
                console.error('Error fetching experiment types:', err);
                setError('Failed to load experiment types. Please refresh the page.');
            }
        };

        fetchExperimentTypes();
    }, []); // Empty dependency array = run once on mount

    /**
     * Handle input changes for text fields.
     *
     * This is a generic handler that works for any text input.
     * It uses the input's name attribute to know which field to update.
     *
     * The event parameter is a SyntheticEvent that React provides.
     * It wraps the native browser event with a consistent interface.
     */
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // Update form data using the functional update pattern
        // This ensures we're working with the latest state
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    /**
     * Validate form data before submission.
     *
     * Returns an object with field names as keys and error messages as values.
     * An empty object means validation passed.
     */
    const validateForm = () => {
        const errors = {};

        // Required fields
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }

        if (!formData.experiment_type_id) {
            errors.experiment_type_id = 'Experiment type is required';
        }

        if (!formData.experiment_date) {
            errors.experiment_date = 'Experiment date is required';
        }

        // Numeric validations
        if (formData.temperature_celsius && isNaN(parseFloat(formData.temperature_celsius))) {
            errors.temperature_celsius = 'Temperature must be a number';
        }

        if (formData.pressure_atm) {
            const pressure = parseFloat(formData.pressure_atm);
            if (isNaN(pressure)) {
                errors.pressure_atm = 'Pressure must be a number';
            } else if (pressure <= 0) {
                errors.pressure_atm = 'Pressure must be positive';
            }
        }

        if (formData.humidity_percent) {
            const humidity = parseFloat(formData.humidity_percent);
            if (isNaN(humidity)) {
                errors.humidity_percent = 'Humidity must be a number';
            } else if (humidity < 0 || humidity > 100) {
                errors.humidity_percent = 'Humidity must be between 0 and 100';
            }
        }

        return errors;
    };

    /**
     * Handle form submission.
     *
     * This is called when the user clicks the submit button or presses Enter.
     * We prevent the default form submission, validate, and send to API.
     */
    const handleSubmit = async (event) => {
        // Prevent default form submission which would reload the page
        event.preventDefault();

        // Validate form data
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        // Prepare data for API
        // Convert empty strings to null for optional numeric fields
        const submitData = {
            ...formData,
            experiment_type_id: parseInt(formData.experiment_type_id),
            user_id: parseInt(formData.user_id),
            temperature_celsius: formData.temperature_celsius ? parseFloat(formData.temperature_celsius) : null,
            pressure_atm: formData.pressure_atm ? parseFloat(formData.pressure_atm) : null,
            humidity_percent: formData.humidity_percent ? parseFloat(formData.humidity_percent) : null,
        };

        try {
            setSubmitting(true);
            setError(null);

            // Call API to create experiment
            const createdExperiment = await experimentsAPI.create(submitData);

            // Navigate to the newly created experiment's detail page
            // The navigate function comes from React Router and changes the URL
            // without a full page reload
            navigate(`/experiments/${createdExperiment.id}`);
        } catch (err) {
            console.error('Error creating experiment:', err);

            // Handle validation errors from FastAPI
            if (err.response?.status === 422 && err.response?.data?.detail) {
                // FastAPI validation errors come as an array of error objects
                const validationErrors = err.response.data.detail;

                // Check if it's an array (field-level validation errors)
                if (Array.isArray(validationErrors)) {
                    // Extract field-specific errors
                    const fieldErrors = {};

                    validationErrors.forEach(error => {
                        // error.loc is an array like ["body", "pressure_atm"]
                        // We want the last element which is the field name
                        const fieldName = error.loc[error.loc.length - 1];
                        // error.msg contains the human-readable error message
                        fieldErrors[fieldName] = error.msg;
                    });

                    // Set field-specific errors to show under inputs
                    setValidationErrors(fieldErrors);

                    // Also set a general error message
                    setError('Please correct the validation errors below.');
                } else if (typeof validationErrors === 'string') {
                    // Sometimes detail is just a string
                    setError(validationErrors);
                } else {
                    // Fallback for unexpected error format
                    setError('Validation failed. Please check your inputs.');
                }
            } else {
                // Extract error message from API response for other errors
                const errorMessage = err.response?.data?.detail ||
                    'Failed to create experiment. Please try again.';
                setError(errorMessage);
            }

            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Render the form.
     *
     * Each input is a controlled component whose value comes from state
     * and whose changes update state through handleInputChange.
     */
    return (
        <div className="create-experiment-page">
            <div className="page-header">
                <h1>Create New Experiment</h1>
            </div>

            {/* Show error message if submission failed */}
            {error && (
                <div className="error-alert">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/*
        The form element's onSubmit fires when:
        1. User clicks the submit button
        2. User presses Enter while focused in an input
        
        Attaching the handler to the form rather than the button
        ensures both methods work.
      */}
            <form onSubmit={handleSubmit} className="experiment-form">
                {/* Title field - required text input */}
                <div className="form-group">
                    <label htmlFor="title" className="required">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={validationErrors.title ? 'input-error' : ''}
                        placeholder="Enter experiment title"
                        disabled={submitting}
                    />
                    {validationErrors.title && (
                        <span className="error-message">{validationErrors.title}</span>
                    )}
                </div>

                {/* Description field - multiline text */}
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Describe the experiment's purpose and methodology"
                        disabled={submitting}
                    />
                </div>

                {/* Two-column layout for type and date */}
                <div className="form-row">
                    {/* Experiment type dropdown */}
                    <div className="form-group">
                        <label htmlFor="experiment_type_id" className="required">
                            Experiment Type
                        </label>
                        <select
                            id="experiment_type_id"
                            name="experiment_type_id"
                            value={formData.experiment_type_id}
                            onChange={handleInputChange}
                            className={validationErrors.experiment_type_id ? 'input-error' : ''}
                            disabled={submitting}
                        >
                            <option value="">Select a type</option>
                            {experimentTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {validationErrors.experiment_type_id && (
                            <span className="error-message">{validationErrors.experiment_type_id}</span>
                        )}
                    </div>

                    {/* Experiment date field */}
                    <div className="form-group">
                        <label htmlFor="experiment_date" className="required">
                            Experiment Date
                        </label>
                        <input
                            type="datetime-local"
                            id="experiment_date"
                            name="experiment_date"
                            value={formData.experiment_date}
                            onChange={handleInputChange}
                            className={validationErrors.experiment_date ? 'input-error' : ''}
                            disabled={submitting}
                        />
                        {validationErrors.experiment_date && (
                            <span className="error-message">{validationErrors.experiment_date}</span>
                        )}
                    </div>
                </div>

                {/* Environmental conditions section */}
                <fieldset className="form-section">
                    <legend>Environmental Conditions</legend>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="temperature_celsius">Temperature (°C)</label>
                            <input
                                type="number"
                                id="temperature_celsius"
                                name="temperature_celsius"
                                value={formData.temperature_celsius}
                                onChange={handleInputChange}
                                step="0.01"
                                placeholder="e.g., 25.5"
                                className={validationErrors.temperature_celsius ? 'input-error' : ''}
                                disabled={submitting}
                            />
                            {validationErrors.temperature_celsius && (
                                <span className="error-message">{validationErrors.temperature_celsius}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="pressure_atm">Pressure (atm)</label>
                            <input
                                type="number"
                                id="pressure_atm"
                                name="pressure_atm"
                                value={formData.pressure_atm}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="100"
                                placeholder="e.g., 1.013"
                                className={validationErrors.pressure_atm ? 'input-error' : ''}
                                disabled={submitting}
                            />
                            {validationErrors.pressure_atm && (
                                <span className="error-message">{validationErrors.pressure_atm}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="humidity_percent">Humidity (%)</label>
                            <input
                                type="number"
                                id="humidity_percent"
                                name="humidity_percent"
                                value={formData.humidity_percent}
                                onChange={handleInputChange}
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="e.g., 45.0"
                                className={validationErrors.humidity_percent ? 'input-error' : ''}
                                disabled={submitting}
                            />
                            {validationErrors.humidity_percent && (
                                <span className="error-message">{validationErrors.humidity_percent}</span>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Status dropdown */}
                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={submitting}
                    >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Notes field */}
                <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Additional notes or conclusions"
                        disabled={submitting}
                    />
                </div>

                {/* Form actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/experiments')}
                        className="btn btn-secondary"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Experiment'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateExperimentPage;