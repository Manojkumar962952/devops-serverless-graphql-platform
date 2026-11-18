-- =============================================================================
-- Initial Seed Data for Employee Management Application
-- =============================================================================

INSERT INTO employees (id, first_name, last_name, email, department, role, salary, phone, date_of_joining, status)
VALUES
    ('e1000001-0000-0000-0000-000000000001', 'Alex', 'Morgan', 'alex.morgan@company.com', 'Engineering', 'Senior DevOps Engineer', 125000.00, '+1-555-0101', '2023-01-15', 'ACTIVE'),
    ('e1000002-0000-0000-0000-000000000002', 'Sarah', 'Connor', 'sarah.connor@company.com', 'Cloud Architecture', 'Lead Cloud Architect', 145000.00, '+1-555-0102', '2022-06-01', 'ACTIVE'),
    ('e1000003-0000-0000-0000-000000000003', 'David', 'Kim', 'david.kim@company.com', 'Engineering', 'Site Reliability Engineer', 110000.00, '+1-555-0103', '2023-03-20', 'ACTIVE'),
    ('e1000004-0000-0000-0000-000000000004', 'Elena', 'Rostova', 'elena.rostova@company.com', 'Security', 'DevSecOps Specialist', 130000.00, '+1-555-0104', '2022-11-10', 'ACTIVE'),
    ('e1000005-0000-0000-0000-000000000005', 'Marcus', 'Vance', 'marcus.vance@company.com', 'Product', 'Technical Product Manager', 120000.00, '+1-555-0105', '2024-01-08', 'ON_LEAVE'),
    ('e1000006-0000-0000-0000-000000000006', 'Priya', 'Patel', 'priya.patel@company.com', 'Engineering', 'Backend Software Engineer', 105000.00, '+1-555-0106', '2023-08-14', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;
