/**
 * Axios-based API client configuration.
 *
 * This module creates and configures an Axios instance that all API service
 * modules will use. Centralizing the configuration here ensures consistent
 * behavior across all API calls, including base URL, headers, and error handling.
 *
 * The client is configured with:
 * - Base URL from environment variable or default
 * - JSON content type headers
 * - Response interceptors for error transformation
 */

import axios, { AxiosError, type AxiosInstance } from 'axios';

/**
 * Custom error type for API errors.
 *
 * This provides a consistent error shape across the application, making it
 * easier for components to handle and display errors appropriately.
 */
export interface ApiError {
    message: string;
    status?: number;
    detail?: string | Record<string, unknown>;
    validationErrors?: Array<{
        loc: (string | number)[];
        msg: string;
        type: string;
    }>;
}

/**
 * Transform Axios errors into our ApiError format.
 *
 * This function extracts useful information from various error scenarios:
 * - HTTP errors with response data (validation errors, not found, etc.)
 * - Network errors (no response received)
 * - Request configuration errors
 */
function transformError(error: AxiosError): ApiError {
    if (error.response) {
        // Server responded with error status
        const data = error.response.data as Record<string, unknown>;

        // Handle FastAPI validation errors (422 responses)
        if (error.response.status === 422 && data.detail) {
            const detail = data.detail;
            if (Array.isArray(detail)) {
                return {
                    message: 'Validation error',
                    status: 422,
                    validationErrors: detail,
                };
            }
        }

        return {
            message: (data.detail as string) || (data.message as string) || 'An error occurred',
            status: error.response.status,
            detail: data.detail as string | Record<string, unknown>,
        };
    }

    if (error.request) {
        // Request was made but no response received
        return {
            message: 'Network error - no response received',
            detail: 'Please check your connection and try again.',
        };
    }

    // Error in request configuration
    return {
        message: error.message || 'Request failed',
    };
}

/**
 * Create and configure the Axios instance.
 *
 * The base URL defaults to localhost:8000 for development. In production,
 * this would be set via environment variable to point to the deployed API.
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout after 30 seconds
    timeout: 30000,
});

/**
 * Response interceptor for error handling.
 *
 * This interceptor catches all error responses and transforms them into
 * our ApiError format before rejecting the promise. Components can then
 * handle errors consistently regardless of the original error type.
 */
apiClient.interceptors.response.use(
    // Pass through successful responses unchanged
    (response) => response,
    // Transform errors before rejecting
    (error: AxiosError) => {
        const apiError = transformError(error);
        return Promise.reject(apiError);
    }
);

/**
 * Request interceptor for logging (development only)
 */
if (import.meta.env.DEV) {
    apiClient.interceptors.request.use(
        (config) => {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
            return config;
        },
        (error) => Promise.reject(error)
    );
}

export default apiClient;
