-- =============================================================================
-- DevOps Assessment: Employee Management Database Schema
-- Database: PostgreSQL 14+ (Amazon RDS PostgreSQL)
-- =============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects if resetting
DROP TABLE IF EXISTS employees CASCADE;
DROP TYPE IF EXISTS employee_status_enum CASCADE;

-- Create status enum
CREATE TYPE employee_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- -----------------------------------------------------------------------------
-- Table: employees
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    phone VARCHAR(50),
    date_of_joining DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Indexes for Performance & Query Optimization
-- -----------------------------------------------------------------------------
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_created_at ON employees(created_at DESC);

-- -----------------------------------------------------------------------------
-- Trigger: Automatically update 'updated_at' timestamp on record updates
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
