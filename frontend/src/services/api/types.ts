/**
 * TypeScript types matching backend Pydantic schemas.
 *
 * These types define the shape of data exchanged with the API, ensuring
 * type safety throughout the frontend. They should be kept in sync with
 * the backend schemas as the API evolves.
 *
 * The organization mirrors the backend schema organization, with types
 * grouped by domain (core, catalysts, etc.) for maintainability.
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string; // ISO 8601 datetime string
    updated_at: string;
}

export interface UserCreate {
    username: string;
    email: string;
    full_name: string;
    is_active?: boolean;
}

export interface UserUpdate {
    email?: string;
    full_name?: string;
    is_active?: boolean;
}

// ============================================================================
// Catalyst Domain Types
// ============================================================================

export interface Chemical {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    methods?: Method[];
}

export interface ChemicalCreate {
    name: string;
}

export interface ChemicalUpdate {
    name?: string;
}

export interface Method {
    id: number;
    descriptive_name: string;
    procedure: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Optional nested data when include=chemicals is used
    chemicals?: Chemical[];
}

export interface MethodCreate {
    descriptive_name: string;
    procedure: string;
    chemical_ids?: number[];
    is_active?: boolean;
}

export interface MethodUpdate {
    descriptive_name?: string;
    procedure?: string;
    chemical_ids?: number[];
    is_active?: boolean;
}

export interface Support {
    id: number;
    descriptive_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface SupportCreate {
    descriptive_name: string;
    description?: string;
}

export interface SupportUpdate {
    descriptive_name?: string;
    description?: string;
}

/**
 * Simplified catalyst representation for nested relationships.
 * This prevents infinite recursion when catalysts reference other catalysts.
 */
export interface CatalystSimple {
    id: number;
    name: string;
    method_id?: number;
    yield_amount: string; // Decimal comes as string from backend
    remaining_amount: string;
    storage_location: string;
    created_at: string;
}

export interface Catalyst {
    id: number;
    name: string;
    method_id?: number;
    yield_amount: string; // Decimal comes as string from backend
    remaining_amount: string;
    storage_location: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Optional nested data when include parameter is used
    method?: Method;
    input_catalysts?: CatalystSimple[];
    output_catalysts?: CatalystSimple[];
}

export interface CatalystCreate {
    name: string;
    method_id?: number;
    yield_amount: number | string; // Accept both for form flexibility
    remaining_amount: number | string;
    storage_location: string;
    notes?: string;
    input_catalyst_ids?: number[];
}

export interface CatalystUpdate {
    name?: string;
    method_id?: number;
    yield_amount?: number | string;
    remaining_amount?: number | string;
    storage_location?: string;
    notes?: string;
    input_catalyst_ids?: number[];
}

// ============================================================================
// Query Parameters Types
// ============================================================================

/**
 * Common pagination parameters used across list endpoints.
 */
export interface PaginationParams {
    skip?: number;
    limit?: number;
}

/**
 * Parameters for user list endpoint.
 */
export interface UserListParams extends PaginationParams {
    is_active?: boolean;
    search?: string;
}

/**
 * Parameters for chemical list endpoint.
 */
export interface ChemicalListParams extends PaginationParams {
    search?: string;
}

/**
 * Parameters for method list endpoint.
 */
export interface MethodListParams extends PaginationParams {
    is_active?: boolean;
    search?: string;
    include?: string; // Comma-separated: "chemicals"
}

/**
 * Parameters for support list endpoint.
 */
export interface SupportListParams extends PaginationParams {
    search?: string;
}

/**
 * Parameters for catalyst list endpoint.
 */
export interface CatalystListParams extends PaginationParams {
    search?: string;
    method_id?: number;
    depleted?: boolean;
    include?: string; // Comma-separated: "method,input_catalysts,output_catalysts"
}