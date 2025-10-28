/**
 * API service for communicating with the backend.
 *
 * This module provides functions for all API operations, abstracting away
 * the details of HTTP requests from components. Components call these
 * functions and get back promises that resolve with data or reject with errors.
 */

import axios from 'axios';

// Get the API base URL from environment variable
// During development with Docker, this will be http://localhost:8000
// In production, this would be your actual API URL
// The REACT_APP_ prefix is required for Create React App to include the variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create an axios instance with default configuration
// This instance can be customized with interceptors for auth, logging, etc.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout after 10 seconds to prevent hanging requests
    timeout: 10000,
});

// Request interceptor - runs before every request
// This is where you'd add authentication tokens when you implement auth
apiClient.interceptors.request.use(
    (config) => {
        // Example: Add auth token to headers
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - runs after every response
// This is where you'd handle global error cases like expired tokens
apiClient.interceptors.response.use(
    (response) => {
        // Just return the data portion of the response
        // Axios wraps responses in {data, status, headers, config, request}
        // We usually only care about data
        return response.data;
    },
    (error) => {
        // Handle common error cases
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);

            // You could handle specific status codes here
            // if (error.response.status === 401) {
            //   // Redirect to login
            // }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network Error:', error.request);
        } else {
            // Something else went wrong
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

/**
 * Experiment Types API
 * Functions for managing experiment type categories
 */
export const experimentTypesAPI = {
    /**
     * Get all experiment types
     * @param {Object} params - Query parameters
     * @param {number} params.skip - Number of records to skip
     * @param {number} params.limit - Maximum records to return
     * @param {boolean} params.include_inactive - Include deactivated types
     * @returns {Promise<Array>} Array of experiment types
     */
    getAll: (params = {}) => {
        return apiClient.get('/api/experiment-types/', { params });
    },

    /**
     * Get a single experiment type by ID
     * @param {number} id - Experiment type ID
     * @returns {Promise<Object>} Experiment type object
     */
    getById: (id) => {
        return apiClient.get(`/api/experiment-types/${id}`);
    },

    /**
     * Create a new experiment type
     * @param {Object} data - Experiment type data
     * @param {string} data.name - Name of the experiment type
     * @param {string} data.description - Description
     * @returns {Promise<Object>} Created experiment type
     */
    create: (data) => {
        return apiClient.post('/api/experiment-types/', data);
    },

    /**
     * Update an experiment type
     * @param {number} id - Experiment type ID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object>} Updated experiment type
     */
    update: (id, data) => {
        return apiClient.patch(`/api/experiment-types/${id}`, data);
    },

    /**
     * Delete an experiment type
     * @param {number} id - Experiment type ID
     * @returns {Promise<void>}
     */
    delete: (id) => {
        return apiClient.delete(`/api/experiment-types/${id}`);
    },
};

/**
 * Experiments API
 * Functions for managing experiments
 */
export const experimentsAPI = {
    /**
     * Get all experiments with optional filtering
     * @param {Object} params - Query parameters
     * @param {number} params.skip - Pagination offset
     * @param {number} params.limit - Maximum results
     * @param {string} params.status - Filter by status
     * @param {number} params.user_id - Filter by user
     * @param {number} params.experiment_type_id - Filter by type
     * @returns {Promise<Array>} Array of experiments
     */
    getAll: (params = {}) => {
        return apiClient.get('/api/experiments/', { params });
    },

    /**
     * Get a single experiment by ID with full details
     * @param {number} id - Experiment ID
     * @param {boolean} includeDetails - Include measurements, observations, files
     * @returns {Promise<Object>} Experiment object
     */
    getById: (id, includeDetails = true) => {
        return apiClient.get(`/api/experiments/${id}`, {
            params: { include_details: includeDetails }
        });
    },

    /**
     * Create a new experiment
     * @param {Object} data - Experiment data
     * @returns {Promise<Object>} Created experiment
     */
    create: (data) => {
        return apiClient.post('/api/experiments/', data);
    },

    /**
     * Update an experiment
     * @param {number} id - Experiment ID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object>} Updated experiment
     */
    update: (id, data) => {
        return apiClient.patch(`/api/experiments/${id}`, data);
    },

    /**
     * Delete an experiment
     * @param {number} id - Experiment ID
     * @returns {Promise<void>}
     */
    delete: (id) => {
        return apiClient.delete(`/api/experiments/${id}`);
    },
};

/**
 * Measurements API
 * Functions for managing measurements within experiments
 */
export const measurementsAPI = {
    /**
     * Get all measurements for an experiment
     * @param {number} experimentId - Parent experiment ID
     * @returns {Promise<Array>} Array of measurements
     */
    getAll: (experimentId) => {
        return apiClient.get(`/api/experiments/${experimentId}/measurements/`);
    },

    /**
     * Create a new measurement
     * @param {number} experimentId - Parent experiment ID
     * @param {Object} data - Measurement data
     * @returns {Promise<Object>} Created measurement
     */
    create: (experimentId, data) => {
        return apiClient.post(`/api/experiments/${experimentId}/measurements/`, data);
    },

    /**
     * Update a measurement
     * @param {number} experimentId - Parent experiment ID
     * @param {number} measurementId - Measurement ID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object>} Updated measurement
     */
    update: (experimentId, measurementId, data) => {
        return apiClient.patch(
            `/api/experiments/${experimentId}/measurements/${measurementId}`,
            data
        );
    },

    /**
     * Delete a measurement
     * @param {number} experimentId - Parent experiment ID
     * @param {number} measurementId - Measurement ID
     * @returns {Promise<void>}
     */
    delete: (experimentId, measurementId) => {
        return apiClient.delete(
            `/api/experiments/${experimentId}/measurements/${measurementId}`
        );
    },
};

// Export the configured axios instance in case components need direct access
export default apiClient;