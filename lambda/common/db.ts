import { Pool, PoolConfig } from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// Global cache for the pool across Lambda warm invocations
let pool: Pool | null = null;
let secretsClient: SecretsManagerClient | null = null;

interface DbCredentials {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

/**
 * Resolves database credentials either from AWS Secrets Manager
 * or directly from Environment Variables.
 */
async function resolveDbCredentials(): Promise<DbCredentials> {
  const secretName = process.env.DB_SECRET_NAME;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

  if (secretName) {
    try {
      if (!secretsClient) {
        secretsClient = new SecretsManagerClient({ region });
      }
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      if (response.SecretString) {
        const secret = JSON.parse(response.SecretString);
        return {
          host: secret.host || secret.DB_HOST || process.env.DB_HOST || 'localhost',
          port: parseInt(secret.port || secret.DB_PORT || process.env.DB_PORT || '5432', 10),
          database: secret.dbname || secret.database || secret.DB_NAME || process.env.DB_NAME || 'employeedb',
          user: secret.username || secret.user || secret.DB_USER || process.env.DB_USER || 'postgres',
          password: secret.password || secret.DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
          ssl: process.env.DB_SSL === 'true' || Boolean(secret.ssl),
        };
      }
    } catch (err) {
      console.warn(`[DB] Failed to fetch secret "${secretName}" from Secrets Manager. Falling back to env variables. Error:`, (err as Error).message);
    }
  }

  // Fallback to standard environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'employeedb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  };
}

/**
 * Returns a pooled PostgreSQL client instance.
 * Reuses connection across warm Lambda containers.
 */
export async function getDbPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const creds = await resolveDbCredentials();

  const poolConfig: PoolConfig = {
    host: creds.host,
    port: creds.port,
    database: creds.database,
    user: creds.user,
    password: creds.password,
    max: parseInt(process.env.DB_POOL_MAX || '5', 10), // Safe pool size for Lambda
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  // Enable SSL for RDS connections (always enabled for RDS unless explicitly connecting to local container)
  const isLocal = creds.host === 'localhost' || creds.host === 'postgres' || creds.host === '127.0.0.1';
  if (!isLocal || creds.ssl || process.env.DB_SSL === 'true') {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Required for RDS default certificates
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}

/**
 * Helper to execute a parameterized query using the pool.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const dbPool = await getDbPool();
  const start = Date.now();
  try {
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[DB] Executed query in ${duration}ms: ${text}`);
    }
    return res.rows;
  } catch (error) {
    console.error(`[DB] Query error on: ${text}`, error);
    throw error;
  }
}
