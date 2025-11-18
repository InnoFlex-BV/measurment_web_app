/**
 * Base API client configuration and utilities.
 *
 * This module provides the foundational Axios instance that all API services
 * use, ensuring consistent configuration for base URL, timeouts, headers,
 * and error handling across all API requests.
 *
 * The interceptor pattern allows us to transform requests and responses
 * globally, which is where we'll add authentication tokens, logging,
 * and standardized error handling as the application grows.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * Base URL for the API.
 *
 * In development, this points to your local backend container.
 * In production, you'd use an environment variable:
 * const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
 *
 * Vite exposes environment variables through import.meta.env, and variables
 * prefixed with VITE_ are available in the client-side code. This lets you
 * configure different API URLs for development, staging, and production
 * without changing code.
 */
const API_BASE_URL = 'http://localhost:8000';
 // TODO: in the future add: const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Create the Axios instance with default configuration.
 *
 * This instance is used by all API service modules, ensuring consistent
 * configuration. The timeout prevents hanging requests, and the default
 * headers ensure JSON communication.
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 second timeout for requests
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor for adding authentication and logging.
 *
 * Request interceptors run before every request is sent, allowing you to
 * modify the request configuration. This is where you'd add authentication
 * tokens from local storage or session storage.
 *
 * TODO: Add authentication token handling when auth is implemented
 * const token = localStorage.getItem('auth_token');
 * if (token) {
 *   config.headers.Authorization = `Bearer ${token}`;
 * }
 */
apiClient.interceptors.request.use(
    (config) => {
        // Log requests in development for debugging
        // TODO: add this back later import.meta.env.DEV
        if (true) {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for error handling and transformation.
 *
 * Response interceptors run after every response is received, allowing you
 * to transform response data or handle errors globally. This is where we
 * standardize error handling so every API call doesn't need its own error
 * handling logic.
 */
apiClient.interceptors.response.use(
    (response) => {
        // Successful responses pass through unchanged
        return response;
    },
    (error: AxiosError) => {
        // Handle different error types with user-friendly messages
        if (error.response) {
            // The request was made and the server responded with an error status
            // This is where we transform backend error responses into messages
            // that make sense in the UI context

            const status = error.response.status;
            const data = error.response.data as any;

            // Extract error message from various possible response structures
            let message = 'An error occurred';
            if (typeof data === 'string') {
                message = data;
            } else if (data.detail) {
                // FastAPI returns errors in a detail field
                if (typeof data.detail === 'string') {
                    message = data.detail;
                } else if (Array.isArray(data.detail)) {
                    // Validation errors come as an array of error objects
                    message = data.detail.map((err: any) => err.msg).join(', ');
                }
            } else if (data.message) {
                message = data.message;
            }

            console.error(`API Error ${status}:`, message);

            // TODO: Add toast notifications for errors
            // When you add a toast/notification library, trigger notifications here
            // so users see friendly error messages without each component needing
            // to handle error display

            return Promise.reject({
                status,
                message,
                data: data,
            });
        } else if (error.request) {
            // The request was made but no response was received
            // This usually means network issues or the backend is down
            console.error('Network Error: No response received');
            return Promise.reject({
                status: 0,
                message: 'Network error. Please check your connection.',
            });
        } else {
            // Something happened in setting up the request
            console.error('Request Error:', error.message);
            return Promise.reject({
                status: -1,
                message: error.message,
            });
        }
    }
);

export default apiClient;

/**
 * Standard error type for API errors.
 *
 * This type definition creates consistency across the application for how
 * API errors are represented. Every error handling block can expect this
 * structure, making error handling predictable and testable.
 */
export interface ApiError {
    status: number;
    message: string;
    data?: any;
}