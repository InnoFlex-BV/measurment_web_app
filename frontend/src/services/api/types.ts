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
 * - Experiments Domain: Waveforms, Reactors, Analyzers, Experiments
 * - Reference Domain: Contaminants, Carriers, Groups
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
    experiments?: ExperimentSimple[];
}

export interface UserCreate {
    username: string;
    email: string;
    full_name: string;
    is_active?: boolean;
}

export interface UserUpdate {
    username?: string;
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
    storage_path: string;
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
    storage_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by_id?: number;
}

export interface FileUpdate {
    filename?: string;
    storage_path?: string;
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
    notes?: string;
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
    experiments?: ExperimentSimple[];
    users?: UserSimple[];
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
    notes?: string;
}

export interface SampleUpdate {
    name?: string;
    catalyst_id?: number;
    support_id?: number;
    method_id?: number;
    yield_amount?: number | string;
    remaining_amount?: number | string;
    storage_location?: string;
    notes?: string;
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
    objective: string;
    created_at: string;
}

export interface Observation {
    id: number;
    objective: string;
    conditions: Record<string, unknown>;
    calcination_parameters: Record<string, unknown>;
    observations_text: string;
    data: Record<string, unknown>;
    conclusions: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    has_calcination_data?: boolean;
    catalyst_count?: number;
    sample_count?: number;
    file_count?: number;
    // Optional nested data
    catalysts?: CatalystSimple[];
    samples?: SampleSimple[];
    files?: FileMetadataSimple[];
    users?: UserSimple[];
}

export interface ObservationCreate {
    objective: string;
    observations_text: string;
    conclusions: string;
    conditions?: Record<string, unknown>;
    calcination_parameters?: Record<string, unknown>;
    data?: Record<string, unknown>;
    catalyst_ids?: number[];
    sample_ids?: number[];
    file_ids?: number[];
    user_ids?: number[];
}

export interface ObservationUpdate {
    objective?: string;
    observations_text?: string;
    conclusions?: string;
    conditions?: Record<string, unknown>;
    calcination_parameters?: Record<string, unknown>;
    data?: Record<string, unknown>;
    catalyst_ids?: number[];
    sample_ids?: number[];
    file_ids?: number[];
    user_ids?: number[];
}

// ============================================================================
// Waveform Types (Phase 3 - Experiments Domain)
// ============================================================================

export interface Waveform {
    id: number;
    name: string;
    ac_frequency?: string;        // Decimal as string
    ac_duty_cycle?: string;       // Decimal as string
    pulsing_frequency?: string;   // Decimal as string
    pulsing_duty_cycle?: string;  // Decimal as string
    created_at: string;
    updated_at: string;
    // Optional nested data
    experiments?: ExperimentSimple[];
}

export interface WaveformSimple {
    id: number;
    name: string;
}

export interface WaveformCreate {
    name: string;
    ac_frequency?: string;
    ac_duty_cycle?: string;
    pulsing_frequency?: string;
    pulsing_duty_cycle?: string;
}

export interface WaveformUpdate {
    name?: string;
    ac_frequency?: string;
    ac_duty_cycle?: string;
    pulsing_frequency?: string;
    pulsing_duty_cycle?: string;
}

export interface WaveformListParams {
    skip?: number;
    limit?: number;
    search?: string;
    include?: string;
}

// ============================================================================
// Reactor Types (Phase 3 - Experiments Domain)
// ============================================================================

export interface Reactor {
    id: number;
    name: string;
    description?: string;
    volume?: string;              // Decimal as string
    created_at: string;
    updated_at: string;
    // Computed properties
    experiment_count?: number;
    is_in_use?: boolean;
    // Optional nested data
    experiments?: ExperimentSimple[];
}

export interface ReactorSimple {
    id: number;
    name: string;
    description?: string;
    volume?: string;
}

export interface ReactorCreate {
    name: string;
    description?: string;
    volume?: string;
}

export interface ReactorUpdate {
    name?: string;
    description?: string;
    volume?: string;
}

export interface ReactorListParams {
    skip?: number;
    limit?: number;
    search?: string;
    include?: string;
}

// ============================================================================
// Processed Types (Phase 3 - Experiments Domain)
// ============================================================================

/**
 * Processed results store calculated performance metrics from experiments.
 *
 * DRE (Decomposition/Removal Efficiency): Percentage of contaminant decomposed
 * EY (Energy Yield): Mass decomposed per unit energy (g/kWh)
 */
export interface Processed {
    id: number;
    dre?: string | null;        // Decomposition/Removal Efficiency (%)
    ey?: string | null;         // Energy Yield (g/kWh)
    has_dre?: boolean | null;   // Whether DRE is recorded
    has_ey?: boolean | null;    // Whether EY is recorded
    is_complete?: boolean | null; // Whether both metrics recorded
    // Optional nested data
    experiments?: ExperimentSimple[];
}

export interface ProcessedSimple {
    id: number;
    dre?: string | null;
    ey?: string | null;
}

export interface ProcessedCreate {
    dre?: number | string;
    ey?: number | string;
    /** IDs of experiments to link. Each experiment's processed_table_id will be updated. */
    experiment_ids?: number[];
}

export interface ProcessedUpdate {
    dre?: number | string | null;
    ey?: number | string | null;
    /**
     * IDs of experiments to link. When provided:
     * - All currently linked experiments are unlinked first
     * - The specified experiments are then linked
     * - Use [] to unlink all experiments
     * - Omit to leave links unchanged
     */
    experiment_ids?: number[];
}

export interface ProcessedListParams {
    skip?: number;
    limit?: number;
    min_dre?: number;
    max_dre?: number;
    min_ey?: number;
    max_ey?: number;
    complete_only?: boolean;
    include?: string;
}

// ============================================================================
// Analyzer Types - Polymorphic (Phase 3 - Experiments Domain)
// ============================================================================

/**
 * Analyzer type discriminator.
 */
export type AnalyzerType = 'ftir' | 'oes';

/**
 * Human-readable labels for analyzer types
 */
export const ANALYZER_TYPE_LABELS: Record<AnalyzerType, string> = {
    ftir: 'FTIR Spectrometer',
    oes: 'Optical Emission Spectrometer',
};

// Base analyzer type
export interface AnalyzerBase {
    id: number;
    name: string;
    analyzer_type: AnalyzerType;
    description?: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    experiment_count?: number;
    is_in_use?: boolean;
    // Optional nested data
    experiments?: ExperimentSimple[];
}

// FTIR Analyzer
export interface FTIRAnalyzer extends AnalyzerBase {
    analyzer_type: 'ftir';
    path_length?: string;      // Decimal as string (cm)
    resolution?: string;       // Decimal as string (cm⁻¹)
    interval?: string;         // Decimal as string
    scans?: number;
}

// OES Analyzer
export interface OESAnalyzer extends AnalyzerBase {
    analyzer_type: 'oes';
    integration_time?: number; // ms
    scans?: number;
}

// Union type for polymorphic responses
export type Analyzer = FTIRAnalyzer | OESAnalyzer;

export interface AnalyzerSimple {
    id: number;
    name: string;
    analyzer_type: AnalyzerType;
}

// Create types
export interface FTIRCreate {
    name: string;
    analyzer_type: 'ftir';
    description?: string;
    path_length?: string;
    resolution?: string;
    interval?: string;
    scans?: number;
}

export interface OESCreate {
    name: string;
    analyzer_type: 'oes';
    description?: string;
    integration_time?: number;
    scans?: number;
}

export type AnalyzerCreate = FTIRCreate | OESCreate;

// Update types
export interface FTIRUpdate {
    name?: string;
    description?: string;
    path_length?: string;
    resolution?: string;
    interval?: string;
    scans?: number;
}

export interface OESUpdate {
    name?: string;
    description?: string;
    integration_time?: number;
    scans?: number;
}

export type AnalyzerUpdate = FTIRUpdate | OESUpdate;

export interface AnalyzerListParams {
    skip?: number;
    limit?: number;
    search?: string;
    analyzer_type?: AnalyzerType;
    include?: string;
}

// ============================================================================
// Contaminant Types (Phase 3 - Reference Domain)
// ============================================================================

export interface Contaminant {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    // Optional nested data
    experiments?: ExperimentSimple[];
}

export interface ContaminantSimple {
    id: number;
    name: string;
}

// Contaminant with ppm for experiment context (from junction table)
export interface ContaminantWithPpm {
    id: number;
    name: string;
    ppm?: string;    // Decimal as string from junction table
}

export interface ContaminantCreate {
    name: string;
}

export interface ContaminantUpdate {
    name?: string;
}

export interface ContaminantListParams {
    skip?: number;
    limit?: number;
    search?: string;
    include?: string;
}

// Data for creating/updating experiment-contaminant relationship
export interface ContaminantExperimentData {
    id: number;
    ppm?: number;
}

// ============================================================================
// Carrier Types (Phase 3 - Reference Domain)
// ============================================================================

export interface Carrier {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    // Optional nested data
    experiments?: ExperimentSimple[];
}

export interface CarrierSimple {
    id: number;
    name: string;
}

// Carrier with ratio for experiment context (from junction table)
export interface CarrierWithRatio {
    id: number;
    name: string;
    ratio?: string;   // Decimal as string from junction table
}

export interface CarrierCreate {
    name: string;
}

export interface CarrierUpdate {
    name?: string;
}

export interface CarrierListParams {
    skip?: number;
    limit?: number;
    search?: string;
    include?: string;
}

// Data for creating/updating experiment-carrier relationship
export interface CarrierExperimentData {
    id: number;
    ratio?: number;
}

// ============================================================================
// Group Types (Phase 3 - Reference Domain)
// ============================================================================

export interface Group {
    id: number;
    name: string;
    purpose?: string;
    discussed_in_id?: number;
    conclusion?: string;
    method?: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    experiment_count?: number;
    // Optional nested data
    discussed_in_file?: FileMetadataSimple;
    experiments?: ExperimentSimple[];
}

export interface GroupSimple {
    id: number;
    name: string;
    purpose?: string;
}

export interface GroupCreate {
    name: string;
    purpose?: string;
    discussed_in_id?: number;
    conclusion?: string;
    method?: string;
}

export interface GroupUpdate {
    name?: string;
    purpose?: string;
    discussed_in_id?: number;
    conclusion?: string;
    method?: string;
}

export interface GroupListParams {
    skip?: number;
    limit?: number;
    search?: string;
    include?: string;
}

// ============================================================================
// Experiment Types - Polymorphic (Phase 3 - Experiments Domain)
// ============================================================================

/**
 * Experiment type discriminator.
 */
export type ExperimentType = 'plasma' | 'photocatalysis' | 'misc';

/**
 * Human-readable labels for experiment types
 */
export const EXPERIMENT_TYPE_LABELS: Record<ExperimentType, string> = {
    plasma: 'Plasma Catalysis',
    photocatalysis: 'Photocatalysis',
    misc: 'Miscellaneous',
};

/**
 * Simplified experiment representation for nested relationships.
 */
export interface ExperimentSimple {
    id: number;
    name: string;
    experiment_type: ExperimentType;
    purpose: string;
}

// Base experiment fields shared by all types
export interface ExperimentBase {
    id: number;
    name: string;
    experiment_type: ExperimentType;
    purpose: string;
    reactor_id?: number;
    analyzer_id?: number;
    raw_data_id?: number;
    figures_id?: number;
    discussed_in_id?: number;
    processed_data?: Record<string, unknown>;
    processed_table_id?: number;
    conclusion?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Computed properties
    sample_count?: number;
    has_raw_data?: boolean;
    has_processed_data?: boolean;
    has_conclusion?: boolean;
    // Optional nested data
    reactor?: ReactorSimple;
    analyzer?: AnalyzerSimple;
    samples?: SampleSimple[];
    contaminants?: ContaminantWithPpm[];
    carriers?: CarrierWithRatio[];
    groups?: GroupSimple[];
    users?: UserSimple[];
    raw_data_file?: FileMetadataSimple;
    figures_file?: FileMetadataSimple;
    discussed_in_file?: FileMetadataSimple;
    processed_results?: ProcessedSimple;
}

// Plasma Experiment
export interface PlasmaExperiment extends ExperimentBase {
    experiment_type: 'plasma';
    // Plasma-specific fields
    driving_waveform_id?: number;
    delivered_power?: string;           // Decimal as string (W)
    on_time?: number;                   // ms or s
    off_time?: number;                  // ms or s
    dc_voltage?: number;                // V
    dc_current?: number;                // mA or A
    measured_waveform_id?: number;
    electrode?: string;
    reactor_external_temperature?: number;  // °C
    // Computed properties
    is_pulsed?: boolean;
    duty_cycle?: number;                // %
    // Plasma-specific nested data
    driving_waveform?: WaveformSimple;
    measured_waveform_file?: FileMetadataSimple;
}

// Photocatalysis Experiment
export interface PhotocatalysisExperiment extends ExperimentBase {
    experiment_type: 'photocatalysis';
    // Photocatalysis-specific fields
    wavelength?: string;   // Decimal as string (nm)
    power?: string;        // Decimal as string (W or mW/cm²)
    // Computed properties
    is_uv?: boolean;       // wavelength < 400nm
    is_visible?: boolean;  // 400nm <= wavelength <= 700nm
}

// Misc Experiment
export interface MiscExperiment extends ExperimentBase {
    experiment_type: 'misc';
    // Misc-specific fields
    description?: string;
}

// Union type for polymorphic responses
export type Experiment = PlasmaExperiment | PhotocatalysisExperiment | MiscExperiment;

// ============================================================================
// Experiment Create Types
// ============================================================================

// Base create fields
interface ExperimentCreateBase {
    name: string;
    purpose: string;
    reactor_id?: number;
    analyzer_id?: number;
    raw_data_id?: number;
    figures_id?: number;
    discussed_in_id?: number;
    processed_data?: Record<string, unknown>;
    processed_table_id?: number;
    conclusion?: string;
    notes?: string;
    // Relationships
    sample_ids?: number[];
    contaminant_data?: ContaminantExperimentData[];
    carrier_data?: CarrierExperimentData[];
    group_ids?: number[];
    user_ids?: number[];
}

export interface PlasmaCreate extends ExperimentCreateBase {
    experiment_type: 'plasma';
    driving_waveform_id?: number;
    delivered_power?: string;
    on_time?: number;
    off_time?: number;
    dc_voltage?: number;
    dc_current?: number;
    measured_waveform_id?: number;
    electrode?: string;
    reactor_external_temperature?: number;
}

export interface PhotocatalysisCreate extends ExperimentCreateBase {
    experiment_type: 'photocatalysis';
    wavelength?: string;
    power?: string;
}

export interface MiscCreate extends ExperimentCreateBase {
    experiment_type: 'misc';
    description?: string;
}

export type ExperimentCreate = PlasmaCreate | PhotocatalysisCreate | MiscCreate;

// ============================================================================
// Experiment Update Types
// ============================================================================

interface ExperimentUpdateBase {
    name?: string;
    purpose?: string;
    reactor_id?: number;
    analyzer_id?: number;
    raw_data_id?: number;
    figures_id?: number;
    discussed_in_id?: number;
    processed_data?: Record<string, unknown>;
    processed_table_id?: number;
    conclusion?: string;
    notes?: string;
    // Relationships
    sample_ids?: number[];
    contaminant_data?: ContaminantExperimentData[];
    carrier_data?: CarrierExperimentData[];
    group_ids?: number[];
    user_ids?: number[];
}

export interface PlasmaUpdate extends ExperimentUpdateBase {
    driving_waveform_id?: number;
    delivered_power?: string;
    on_time?: number;
    off_time?: number;
    dc_voltage?: number;
    dc_current?: number;
    measured_waveform_id?: number;
    electrode?: string;
    reactor_external_temperature?: number;
}

export interface PhotocatalysisUpdate extends ExperimentUpdateBase {
    wavelength?: string;
    power?: string;
}

export interface MiscUpdate extends ExperimentUpdateBase {
    description?: string;
}

export type ExperimentUpdate = PlasmaUpdate | PhotocatalysisUpdate | MiscUpdate;

// ============================================================================
// Experiment List Params
// ============================================================================

export interface ExperimentListParams {
    skip?: number;
    limit?: number;
    search?: string;
    experiment_type?: ExperimentType;
    reactor_id?: number;
    analyzer_id?: number;
    sample_id?: number;
    group_id?: number;
    user_id?: number;
    has_conclusion?: boolean;
    include?: string;
}

// ============================================================================
// Query Parameters Types (Phase 1-2)
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
    has_calcination?: boolean;
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

// ============================================================================
// Type Guards for Polymorphic Types
// ============================================================================

/**
 * Type guard to check if an experiment is a Plasma experiment.
 */
export function isPlasmaExperiment(exp: Experiment): exp is PlasmaExperiment {
    return exp.experiment_type === 'plasma';
}

/**
 * Type guard to check if an experiment is a Photocatalysis experiment.
 */
export function isPhotocatalysisExperiment(exp: Experiment): exp is PhotocatalysisExperiment {
    return exp.experiment_type === 'photocatalysis';
}

/**
 * Type guard to check if an experiment is a Misc experiment.
 */
export function isMiscExperiment(exp: Experiment): exp is MiscExperiment {
    return exp.experiment_type === 'misc';
}

/**
 * Type guard to check if an analyzer is an FTIR analyzer.
 */
export function isFTIRAnalyzer(analyzer: Analyzer): analyzer is FTIRAnalyzer {
    return analyzer.analyzer_type === 'ftir';
}

/**
 * Type guard to check if an analyzer is an OES analyzer.
 */
export function isOESAnalyzer(analyzer: Analyzer): analyzer is OESAnalyzer {
    return analyzer.analyzer_type === 'oes';
}
