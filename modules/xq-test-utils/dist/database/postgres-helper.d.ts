/**
 * PostgreSQL implementation of IDatabaseHelper.
 *
 * Provides connection pooling, health checks, and query utilities
 * for component tests that need direct database access.
 */
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseConfig, HealthCheckResult, IDatabaseHelper } from './types';
export declare class PostgresDatabaseHelper implements IDatabaseHelper {
    private pool;
    private config;
    constructor(config?: DatabaseConfig);
    /**
     * Get default database configuration from environment variables
     */
    private getDefaultConfig;
    /**
     * Initialize database connection pool
     */
    connect(): Promise<void>;
    /**
     * Close database connection pool
     */
    disconnect(): Promise<void>;
    /**
     * Execute a database query
     */
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    /**
     * Get a database client for transactions
     */
    getClient(): Promise<PoolClient>;
    /**
     * Verify database connection is healthy
     */
    checkConnection(): Promise<boolean>;
    /**
     * Verify required database schema tables exist
     */
    verifySchema(requiredTables: string[]): Promise<void>;
    /**
     * Comprehensive database health check
     * Verifies connection, schema, and basic functionality
     */
    healthCheck(requiredTables?: string[]): Promise<HealthCheckResult>;
}
/** @deprecated Use PostgresDatabaseHelper instead */
export declare const DatabaseHelper: typeof PostgresDatabaseHelper;
