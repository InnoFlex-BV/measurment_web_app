/**
 * TypeScript types matching backend Pydantic schemas.
 *
 * These types define the shape of data exchanged with the API, ensuring
 * type safety throughout the frontend. They should be kept in sync with
 * the backend schemas as the API evolves.
 *
 * Organization:
 * - Core Domain: Users, Files, Audit
 * - Catalyst Domain: Chemicals, Methods, Supports, Catalysts, Samples
 * - Characterization Domain: Characterizations, Observations
 * - Experiments Domain: (Phase 3)
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
    created_at: string;
    updated_at: string;
    // Optional nested data
    catalysts?: CatalystSimple[];
    samples?: SampleSimple[];
    characterizations?: CharacterizationSimple[];
    observations?: ObservationSimple[];
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

export interface UserSimple {
    id: number;
    username: string;
    full_name: string;
}

// ============================================================================
// File Domain Types
// ============================================================================

export interface FileMetadata {
    id: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by_id?: number;
    is_deleted: boolean;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
    // Optional nested data
    uploader?: UserSimple;
}

export interface FileMetadataSimple {
    id: number;
    filename: string;
    mime_type: string;
    file_size: number;
}

export interface FileCreate {
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by_id?: number;
}

export interface FileUpdate {
    filename?: string;
    file_path?: string;
}

// ============================================================================
// Catalyst Domain Types
// ============================================================================

export interface Chemical {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    methods?: MethodSimple[];
}

export interface ChemicalCreate {
    name: string;
}

export interface ChemicalUpdate {
    name?: string;
}

export interface ChemicalSimple {
    id: number;
    name: string;
}

export interface Method {
    id: number;
    descriptive_name: string;
    procedure: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    chemicals?: ChemicalSimple[];
    catalyst_count?: number;
    sample_count?: number;
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

export interface MethodSimple {
    id: number;
    descriptive_name: string;
    is_active: boolean;
}

export interface Support {
    id: number;
    descriptive_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    sample_count?: number;
}

export interface SupportCreate {
    descriptive_name: string;
    description?: string;
}

export interface SupportUpdate {
    descriptive_name?: string;
    description?: string;
}

export interface SupportSimple {
    id: number;
    descriptive_name: string;
}

/**
 * Simplified catalyst representation for nested relationships.
 * Prevents infinite recursion in self-referential relationships.
 */
export interface CatalystSimple {
    id: number;
    name: string;
    method_id?: number;
    yield_amount: string;
    remaining_amount: string;
    storage_location: string;
    created_at: string;
}

export interface Catalyst {
    id: number;
    name: string;
    method_id?: number;
    yield_amount: string;
    remaining_amount: string;
    storage_location: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    is_depleted?: boolean;
    usage_percentage?: number;
    // Optional nested data
    method?: MethodSimple;
    input_catalysts?: CatalystSimple[];
    output_catalysts?: CatalystSimple[];
    samples?: SampleSimple[];
    characterizations?: CharacterizationSimple[];
    observations?: ObservationSimple[];
    users?: UserSimple[];
}

export interface CatalystCreate {
    name: string;
    method_id?: number;
    yield_amount: number | string;
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
// Sample Domain Types
// ============================================================================

export interface SampleSimple {
    id: number;
    name: string;
    catalyst_id?: number;
    yield_amount: string;
    remaining_amount: string;
    storage_location: string;
    created_at: string;
}

export interface Sample {
    id: number;
    name: string;
    catalyst_id?: number;
    support_id?: number;
    method_id?: number;
    created_by_id?: number;
    yield_amount: string;
    remaining_amount: string;
    storage_location: string;
    preparation_notes?: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    is_depleted?: boolean;
    usage_percentage?: number;
    // Optional nested data
    catalyst?: CatalystSimple;
    support?: SupportSimple;
    method?: MethodSimple;
    created_by?: UserSimple;
    characterizations?: CharacterizationSimple[];
    observations?: ObservationSimple[];
    experiment_count?: number;
}

export interface SampleCreate {
    name: string;
    catalyst_id?: number;
    support_id?: number;
    method_id?: number;
    created_by_id?: number;
    yield_amount: number | string;
    remaining_amount?: number | string;
    storage_location: string;
    preparation_notes?: string;
}

export interface SampleUpdate {
    name?: string;
    catalyst_id?: number;
    support_id?: number;
    method_id?: number;
    yield_amount?: number | string;
    remaining_amount?: number | string;
    storage_location?: string;
    preparation_notes?: string;
}

// ============================================================================
// Characterization Domain Types
// ============================================================================

/**
 * Characterization types matching backend enum.
 * Each type represents a different analytical measurement technique.
 */
export type CharacterizationType =
    | 'XRD'      // X-ray Diffraction
    | 'BET'      // Surface Area Analysis
    | 'TEM'      // Transmission Electron Microscopy
    | 'SEM'      // Scanning Electron Microscopy
    | 'FTIR'     // Fourier Transform Infrared Spectroscopy
    | 'XPS'      // X-ray Photoelectron Spectroscopy
    | 'TPR'      // Temperature Programmed Reduction
    | 'TGA'      // Thermogravimetric Analysis
    | 'UV_VIS'   // UV-Visible Spectroscopy
    | 'RAMAN'    // Raman Spectroscopy
    | 'ICP_OES'  // Inductively Coupled Plasma - Optical Emission
    | 'CHNS'     // Elemental Analysis
    | 'NMR'      // Nuclear Magnetic Resonance
    | 'GC'       // Gas Chromatography
    | 'HPLC'     // High Performance Liquid Chromatography
    | 'MS'       // Mass Spectrometry
    | 'OTHER';

/**
 * Human-readable labels for characterization types
 */
export const CHARACTERIZATION_TYPE_LABELS: Record<CharacterizationType, string> = {
    XRD: 'X-ray Diffraction (XRD)',
    BET: 'Surface Area Analysis (BET)',
    TEM: 'Transmission Electron Microscopy (TEM)',
    SEM: 'Scanning Electron Microscopy (SEM)',
    FTIR: 'FTIR Spectroscopy',
    XPS: 'X-ray Photoelectron Spectroscopy (XPS)',
    TPR: 'Temperature Programmed Reduction (TPR)',
    TGA: 'Thermogravimetric Analysis (TGA)',
    UV_VIS: 'UV-Visible Spectroscopy',
    RAMAN: 'Raman Spectroscopy',
    ICP_OES: 'ICP-OES Elemental Analysis',
    CHNS: 'CHNS Elemental Analysis',
    NMR: 'Nuclear Magnetic Resonance (NMR)',
    GC: 'Gas Chromatography (GC)',
    HPLC: 'High Performance Liquid Chromatography',
    MS: 'Mass Spectrometry (MS)',
    OTHER: 'Other',
};

export interface CharacterizationSimple {
    id: number;
    name: string;
    characterization_type: CharacterizationType;
    performed_at?: string;
}

export interface Characterization {
    id: number;
    name: string;
    characterization_type: CharacterizationType;
    performed_by_id?: number;
    performed_at?: string;
    equipment_used?: string;
    conditions?: string;
    raw_data_file_id?: number;
    processed_data_file_id?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Optional nested data
    performed_by?: UserSimple;
    raw_data_file?: FileMetadataSimple;
    processed_data_file?: FileMetadataSimple;
    catalysts?: CatalystSimple[];
    samples?: SampleSimple[];
}

export interface CharacterizationCreate {
    name: string;
    characterization_type: CharacterizationType;
    performed_by_id?: number;
    performed_at?: string;
    equipment_used?: string;
    conditions?: string;
    raw_data_file_id?: number;
    processed_data_file_id?: number;
    notes?: string;
}

export interface CharacterizationUpdate {
    name?: string;
    characterization_type?: CharacterizationType;
    performed_by_id?: number;
    performed_at?: string;
    equipment_used?: string;
    conditions?: string;
    raw_data_file_id?: number;
    processed_data_file_id?: number;
    notes?: string;
}

// ============================================================================
// Observation Domain Types
// ============================================================================

export interface ObservationSimple {
    id: number;
    title: string;
    observation_type?: string;
    observed_at?: string;
}

export interface Observation {
    id: number;
    title: string;
    content: string;
    observed_by_id?: number;
    observed_at?: string;
    observation_type?: string;
    created_at: string;
    updated_at: string;
    // Optional nested data
    observed_by?: UserSimple;
    files?: FileMetadataSimple[];
    catalysts?: CatalystSimple[];
    samples?: SampleSimple[];
}

export interface ObservationCreate {
    title: string;
    content: string;
    observed_by_id?: number;
    observed_at?: string;
    observation_type?: string;
    file_ids?: number[];
}

export interface ObservationUpdate {
    title?: string;
    content?: string;
    observed_by_id?: number;
    observed_at?: string;
    observation_type?: string;
    file_ids?: number[];
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

export interface UserListParams extends PaginationParams {
    is_active?: boolean;
    search?: string;
    include?: string;
}

export interface FileListParams extends PaginationParams {
    search?: string;
    mime_type?: string;
    uploaded_by?: number;
    include_deleted?: boolean;
    include?: string;
}

export interface ChemicalListParams extends PaginationParams {
    search?: string;
    include?: string;
}

export interface MethodListParams extends PaginationParams {
    is_active?: boolean;
    search?: string;
    include?: string;
}

export interface SupportListParams extends PaginationParams {
    search?: string;
}

export interface CatalystListParams extends PaginationParams {
    search?: string;
    method_id?: number;
    depleted?: boolean;
    include?: string;
}

export interface SampleListParams extends PaginationParams {
    search?: string;
    catalyst_id?: number;
    support_id?: number;
    method_id?: number;
    created_by?: number;
    depleted?: boolean;
    include?: string;
}

export interface CharacterizationListParams extends PaginationParams {
    search?: string;
    characterization_type?: CharacterizationType;
    performed_by?: number;
    include?: string;
}

export interface ObservationListParams extends PaginationParams {
    search?: string;
    observation_type?: string;
    observed_by?: number;
    include?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic response wrapper for paginated list endpoints (if API uses it)
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    skip: number;
    limit: number;
}

/**
 * User contribution statistics from /api/users/{id}/stats endpoint
 */
export interface UserStats {
    catalysts_created: number;
    samples_created: number;
    characterizations_performed: number;
    observations_made: number;
    experiments_run: number;
}
