/**
 * Factory for creating database helpers.
 *
 * Centralises construction so consumers don't need to know
 * which concrete class to instantiate.
 */
import { DatabaseConfig, IDatabaseHelper } from './types';
/**
 * Create a database helper instance.
 * Currently only 'postgres' is supported; new adapters can be added
 * here without changing consumer code.
 */
export declare function createDatabaseHelper(config?: DatabaseConfig): IDatabaseHelper;
