import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Production-grade connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Maximum number of clients in the pool
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
  // Number of milliseconds a client must sit idle before being released
  idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
  // Number of milliseconds to wait before timing out when connecting a new client
  connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10000', 10),
  // Maximum time a connection can be used before being discarded (5 minutes)
  maxUses: parseInt(process.env.DATABASE_MAX_USES || '7500', 10),
};

export const pool = new Pool(poolConfig);

// Monitor pool events
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database client connected');
  }
});

pool.on('remove', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database client removed');
  }
});

export const db = drizzle({ client: pool, schema });

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed', error);
    return false;
  }
}

/**
 * Get database pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Graceful shutdown - drain pool
 */
export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}
