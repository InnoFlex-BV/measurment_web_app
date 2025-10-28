-- Schema initialization for Laboratory Data Management System
-- This script creates all tables and relationships needed for the application
-- It runs automatically when the PostgreSQL container first starts

-- Enable UUID extension if we decide to use UUIDs in the future
-- PostgreSQL extensions add functionality to the database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table stores information about chemists and researchers
-- This is a core entity that many other tables will reference
CREATE TABLE users (
    -- SERIAL is PostgreSQL's auto-incrementing integer type
    -- It automatically generates unique sequential values
    id SERIAL PRIMARY KEY,
    
    -- Username for login and display purposes
    -- VARCHAR(50) limits length to 50 characters
    -- UNIQUE constraint prevents duplicate usernames
    -- NOT NULL means this field is required
    username VARCHAR(50) UNIQUE NOT NULL,
    
    -- Full name of the user for display in reports
    full_name VARCHAR(100) NOT NULL,
    
    -- Email for notifications and password resets
    -- UNIQUE ensures each email is used only once
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Password hash - never store plain passwords
    -- 255 characters is enough for bcrypt or argon2 hashes
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role determines permissions (admin, researcher, viewer, etc.)
    -- DEFAULT ensures new users are regular researchers unless specified
    role VARCHAR(20) DEFAULT 'researcher' NOT NULL,
    
    -- Whether this account is currently active
    -- Allows disabling accounts without deleting historical data
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Timestamp tracking when the account was created
    -- TIMESTAMP WITH TIME ZONE stores UTC time with zone info
    -- DEFAULT CURRENT_TIMESTAMP automatically sets to current time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Timestamp tracking last modification to the account
    -- Updated whenever user information changes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on email for fast login lookups
-- Indexes dramatically speed up WHERE clauses on indexed columns
-- The UNIQUE constraint already creates an index, but being explicit is clear
CREATE INDEX idx_users_email ON users(email);

-- Index on username for user search functionality
CREATE INDEX idx_users_username ON users(username);


-- Experiment types table provides controlled vocabulary
-- This prevents typos and ensures consistency
CREATE TABLE experiment_types (
    id SERIAL PRIMARY KEY,
    
    -- Name of the experiment type (Titration, Spectroscopy, etc.)
    name VARCHAR(100) UNIQUE NOT NULL,
    
    -- Detailed description of what this experiment type means
    -- TEXT type can store strings of any length
    description TEXT,
    
    -- Whether this type is currently available for selection
    -- Allows deprecating old types without breaking historical data
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for filtering active experiment types
CREATE INDEX idx_experiment_types_active ON experiment_types(is_active);


-- Experiments table is the central entity storing experiment metadata
-- Each row represents one complete experiment
CREATE TABLE experiments (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to experiment_types table
    -- REFERENCES clause creates the relationship
    -- ON DELETE RESTRICT prevents deleting a type if experiments use it
    experiment_type_id INTEGER NOT NULL REFERENCES experiment_types(id) ON DELETE RESTRICT,
    
    -- Foreign key to users table indicating who conducted the experiment
    -- ON DELETE RESTRICT prevents deleting users with experiments
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Short descriptive title of the experiment
    title VARCHAR(200) NOT NULL,
    
    -- Detailed description of purpose, methodology, and notes
    description TEXT,
    
    -- When the experiment was actually performed
    -- This is different from created_at which is when it was logged
    experiment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Environmental conditions during the experiment
    -- NUMERIC(5,2) means up to 999.99 - covers typical lab temperatures
    temperature_celsius NUMERIC(5,2),
    
    -- Atmospheric pressure during experiment
    -- Important for reactions sensitive to pressure
    pressure_atm NUMERIC(6,3),
    
    -- Relative humidity percentage
    humidity_percent NUMERIC(5,2),
    
    -- Additional environmental conditions as JSON
    -- JSON type allows flexible storage of varying conditions
    -- Example: {"ph": 7.2, "lighting": "dark"}
    additional_conditions JSONB,
    
    -- Current status of the experiment
    -- CHECK constraint ensures only valid values are allowed
    status VARCHAR(20) DEFAULT 'planned' NOT NULL CHECK (
        status IN ('planned', 'in_progress', 'completed', 'failed', 'cancelled')
    ),
    
    -- General notes or conclusions about the experiment
    notes TEXT,
    
    -- Timestamps for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on experiment_type_id for filtering by type
CREATE INDEX idx_experiments_type ON experiments(experiment_type_id);

-- Index on user_id for finding all experiments by a user
CREATE INDEX idx_experiments_user ON experiments(user_id);

-- Index on experiment_date for time-based queries
-- This enables fast queries like "all experiments last month"
CREATE INDEX idx_experiments_date ON experiments(experiment_date);

-- Index on status for filtering experiments by their current state
CREATE INDEX idx_experiments_status ON experiments(status);

-- Composite index for common query patterns
-- Supports queries filtering by both user and status efficiently
CREATE INDEX idx_experiments_user_status ON experiments(user_id, status);


-- Measurements table stores quantitative results from experiments
-- Each experiment can have multiple measurements
CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to experiments
    -- ON DELETE CASCADE means deleting an experiment also deletes its measurements
    -- This maintains referential integrity and prevents orphaned data
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    
    -- Descriptive name of what was measured
    -- Examples: "Initial pH", "Final mass", "Absorption at 500nm"
    measurement_name VARCHAR(100) NOT NULL,
    
    -- The actual measured value
    -- NUMERIC with no precision specified allows arbitrary precision
    -- Perfect for scientific data where precision varies
    measurement_value NUMERIC NOT NULL,
    
    -- Unit of measurement (required for meaningful data)
    -- Examples: "mL", "g", "mol/L", "degrees C"
    unit VARCHAR(50) NOT NULL,
    
    -- Measurement uncertainty if tracked
    -- Allows storing error bars or confidence intervals
    uncertainty NUMERIC,
    
    -- When this particular measurement was taken
    -- Useful for experiments where measurements happen at different times
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Additional metadata about the measurement as JSON
    -- Could include instrument used, calibration info, etc.
    measurement_metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on experiment_id for fetching all measurements for an experiment
CREATE INDEX idx_measurements_experiment ON measurements(experiment_id);

-- Index on measurement_name for searching specific types of measurements
CREATE INDEX idx_measurements_name ON measurements(measurement_name);


-- Observations table stores qualitative notes and observations
-- Captures information that doesn't fit into structured measurements
CREATE TABLE observations (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to experiments
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    
    -- When during the experiment this observation was made
    -- Allows reconstructing the timeline of events
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Category of observation for organization
    -- Examples: "color_change", "precipitation", "gas_evolution", "temperature_change"
    observation_type VARCHAR(50),
    
    -- The actual observation text
    -- Can be as detailed as needed
    observation_text TEXT NOT NULL,
    
    -- Severity or importance level
    -- Helps identify critical observations when reviewing data
    severity VARCHAR(20) DEFAULT 'normal' CHECK (
        severity IN ('low', 'normal', 'high', 'critical')
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on experiment_id for fetching all observations for an experiment
CREATE INDEX idx_observations_experiment ON observations(experiment_id);

-- Index on observed_at for chronological sorting
CREATE INDEX idx_observations_time ON observations(observed_at);


-- Files table stores metadata about attachments
-- Actual file bytes are stored on filesystem or object storage, not in database
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to experiments
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    
    -- Original filename as uploaded
    filename VARCHAR(255) NOT NULL,
    
    -- File size in bytes for validation and storage tracking
    file_size BIGINT NOT NULL,
    
    -- MIME type for proper handling when serving files
    -- Examples: "image/png", "application/pdf", "text/csv"
    mime_type VARCHAR(100) NOT NULL,
    
    -- Path where the file is actually stored
    -- Could be local filesystem path or cloud storage URL
    storage_path VARCHAR(500) NOT NULL,
    
    -- Description of what this file contains
    description TEXT,
    
    -- Uploaded by which user (might be different from experiment conductor)
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on experiment_id for fetching all files for an experiment
CREATE INDEX idx_files_experiment ON files(experiment_id);


-- Function to automatically update the updated_at timestamp
-- This is a PostgreSQL trigger function that runs before UPDATE operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the updated_at column to the current timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers that automatically update updated_at on any row modification
-- This ensures the timestamp is always accurate without application code managing it

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Insert some initial data for development and testing

-- Create a few experiment types
INSERT INTO experiment_types (name, description) VALUES
    ('Titration', 'Analytical technique to determine the concentration of an unknown solution'),
    ('Spectroscopy', 'Analysis of matter through its interaction with electromagnetic radiation'),
    ('Chromatography', 'Separation technique for mixtures dissolved in a fluid'),
    ('Synthesis', 'Creation of new chemical compounds from simpler starting materials'),
    ('Characterization', 'Determination of physical and chemical properties of compounds');

-- Create a default admin user (password is 'admin123' hashed with bcrypt)
-- In production, this should be changed immediately
INSERT INTO users (username, full_name, email, password_hash, role) VALUES
    ('admin', 'Administrator', 'admin@lab.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQvd7KjZG', 'admin');

-- Create a sample researcher user for testing
INSERT INTO users (username, full_name, email, password_hash, role) VALUES
    ('jsmith', 'Dr. Jane Smith', 'jane.smith@lab.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQvd7KjZG', 'researcher');
