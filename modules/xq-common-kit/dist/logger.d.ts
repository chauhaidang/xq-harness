/**
 * Log levels for the logger
 */
export declare const LOG_LEVELS: {
    readonly DEBUG: 0;
    readonly INFO: 1;
    readonly WARN: 2;
    readonly ERROR: 3;
};
/**
 * Logger instance for logging messages with different severity levels
 */
export interface Logger {
    /**
     * Sets the minimum log level
     * @param level - The log level (DEBUG, INFO, WARN, ERROR) as a string or number
     */
    setLevel(level: string | number): void;
    /**
     * Logs a debug message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    debug(message: string, ...args: any[]): void;
    /**
     * Logs an info message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    info(message: string, ...args: any[]): void;
    /**
     * Logs a warning message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Logs an error message
     * @param message - The message to log
     * @param args - Additional arguments to log
     */
    error(message: string, ...args: any[]): void;
}
/**
 * Singleton logger instance
 */
export declare const logger: Logger;
