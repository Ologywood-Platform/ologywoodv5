/**
 * Database Connection Pooling Configuration
 * Implements connection pooling for MySQL to improve performance
 * and handle concurrent requests efficiently
 */

import { createPool, Pool } from 'mysql2/promise';

interface PoolConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  enableKeepAlive: boolean;
  keepAliveInitialDelayMs: number;
}

let connectionPool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export async function getConnectionPool(): Promise<Pool> {
  if (connectionPool) {
    return connectionPool;
  }

  const config: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ologywood',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20'),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
  };

  console.log('[DB Pool] Creating connection pool with config:', {
    host: config.host,
    database: config.database,
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,
  });

  try {
    connectionPool = createPool(config);

    // Test connection
    const connection = await connectionPool.getConnection();
    await connection.ping();
    connection.release();

    console.log('[DB Pool] Connection pool created and tested successfully');

    // Log pool stats periodically
    setInterval(() => {
      const poolStats = {
        connectionLimit: config.connectionLimit,
        queueLimit: config.queueLimit,
        timestamp: new Date().toISOString(),
      };
      console.log('[DB Pool] Stats:', poolStats);
    }, 60000); // Log every minute

    return connectionPool;
  } catch (error) {
    console.error('[DB Pool] Failed to create connection pool:', error);
    throw error;
  }
}

/**
 * Close connection pool
 */
export async function closeConnectionPool(): Promise<void> {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('[DB Pool] Connection pool closed');
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  if (!connectionPool) {
    return null;
  }

  return {
    connectionLimit: (connectionPool as any).config?.connectionLimit || 'unknown',
    queueLimit: (connectionPool as any).config?.queueLimit || 'unknown',
    activeConnections: (connectionPool as any)._allConnections?.length || 0,
  };
}

/**
 * Execute query with connection from pool
 */
export async function executeQuery<T>(
  query: string,
  values?: any[]
): Promise<T> {
  const pool = await getConnectionPool();
  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute(query, values);
    return results as T;
  } finally {
    connection.release();
  }
}

/**
 * Execute multiple queries in transaction
 */
export async function executeTransaction(
  queries: Array<{ query: string; values?: any[] }>
): Promise<any[]> {
  const pool = await getConnectionPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const results = [];
    for (const { query, values } of queries) {
      const [result] = await connection.execute(query, values);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Initialize connection pool on startup
 */
export async function initializePool(): Promise<void> {
  try {
    await getConnectionPool();
    console.log('[DB] Connection pool initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize connection pool:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('[DB] Shutting down connection pool...');
  await closeConnectionPool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[DB] Shutting down connection pool...');
  await closeConnectionPool();
  process.exit(0);
});
