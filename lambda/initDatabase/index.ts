import { Pool } from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let secretsClient: SecretsManagerClient | null = null;

async function getCredentials() {
  const secretName = process.env.DB_SECRET_NAME || 'devops/rds/credentials';
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({ region });
  }

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  if (!response.SecretString) {
    throw new Error(`Empty SecretString in secret: ${secretName}`);
  }

  const secret = JSON.parse(response.SecretString);
  return {
    host: secret.host || secret.DB_HOST || 'localhost',
    port: parseInt(secret.port || secret.DB_PORT || '5432', 10),
    user: secret.username || secret.user || 'postgres',
    password: secret.password || secret.DB_PASSWORD,
  };
}

export const handler = async (event: any = {}) => {
  console.log('[initDatabase] Starting RDS schema initialization...');

  const creds = await getCredentials();
  console.log(`[initDatabase] Connected to Secrets Manager. Target host: ${creds.host}`);

  // ---------------------------------------------------------------------------
  // STEP 1: Connect to default 'postgres' database to ensure 'employeedb' exists
  // ---------------------------------------------------------------------------
  const rootPool = new Pool({
    host: creds.host,
    port: creds.port,
    database: 'postgres', // Standard default database always present on Amazon RDS
    user: creds.user,
    password: creds.password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("[initDatabase] Checking if 'employeedb' database exists...");
    const checkDb = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'employeedb';"
    );

    if (checkDb.rows.length === 0) {
      console.log("[initDatabase] 'employeedb' does not exist. Creating database 'employeedb'...");
      await rootPool.query('CREATE DATABASE employeedb;');
      console.log("[initDatabase] Database 'employeedb' created successfully!");
    } else {
      console.log("[initDatabase] Database 'employeedb' already exists.");
    }
  } catch (err) {
    console.warn('[initDatabase] Root check warning:', (err as Error).message);
  } finally {
    await rootPool.end();
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Connect to 'employeedb' to create extensions, tables & seed data
  // ---------------------------------------------------------------------------
  const appPool = new Pool({
    host: creds.host,
    port: creds.port,
    database: 'employeedb',
    user: creds.user,
    password: creds.password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const schemaStatements = [
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    `DROP TABLE IF EXISTS employees CASCADE;`,
    `DROP TYPE IF EXISTS employee_status_enum CASCADE;`,
    `CREATE TYPE employee_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');`,
    `CREATE TABLE IF NOT EXISTS employees (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);`,
    `CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);`,
    `CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);`,
    `CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at DESC);`,
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;`,
    `DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;`,
    `CREATE TRIGGER trg_employees_updated_at
     BEFORE UPDATE ON employees
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();`,
  ];

  const seedSql = `
    INSERT INTO employees (id, first_name, last_name, email, department, role, salary, phone, date_of_joining, status)
    VALUES
      ('e1000001-0000-0000-0000-000000000001', 'Alex', 'Morgan', 'alex.morgan@company.com', 'Engineering', 'Senior DevOps Engineer', 125000.00, '+1-555-0101', '2023-01-15', 'ACTIVE'),
      ('e1000002-0000-0000-0000-000000000002', 'Sarah', 'Connor', 'sarah.connor@company.com', 'Cloud Architecture', 'Lead Cloud Architect', 145000.00, '+1-555-0102', '2022-06-01', 'ACTIVE'),
      ('e1000003-0000-0000-0000-000000000003', 'David', 'Kim', 'david.kim@company.com', 'Engineering', 'Site Reliability Engineer', 110000.00, '+1-555-0103', '2023-03-20', 'ACTIVE'),
      ('e1000004-0000-0000-0000-000000000004', 'Elena', 'Rostova', 'elena.rostova@company.com', 'Security', 'DevSecOps Specialist', 130000.00, '+1-555-0104', '2022-11-10', 'ACTIVE'),
      ('e1000005-0000-0000-0000-000000000005', 'Marcus', 'Vance', 'marcus.vance@company.com', 'Product', 'Technical Product Manager', 120000.00, '+1-555-0105', '2024-01-08', 'ON_LEAVE'),
      ('e1000006-0000-0000-0000-000000000006', 'Priya', 'Patel', 'priya.patel@company.com', 'Engineering', 'Backend Software Engineer', 105000.00, '+1-555-0106', '2023-08-14', 'ACTIVE')
    ON CONFLICT (email) DO NOTHING;
  `;

  try {
    for (const stmt of schemaStatements) {
      await appPool.query(stmt);
    }
    console.log('[initDatabase] Schema DDL executed successfully.');

    await appPool.query(seedSql);
    console.log('[initDatabase] Seed data inserted successfully.');

    const check = await appPool.query('SELECT count(*) FROM employees;');
    const count = check.rows[0]?.count || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database employeedb and employees table initialized successfully!',
        employeeCount: count,
      }),
    };
  } catch (error) {
    console.error('[initDatabase] Database initialization failed:', error);
    throw error;
  } finally {
    await appPool.end();
  }
};
