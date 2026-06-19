"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LOG_LEVELS = void 0;
/**
 * Log levels for the logger
 */
exports.LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
const LOG_COLORS = {
    DEBUG: '\x1b[36m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m'
};
class LoggerImpl {
    level = exports.LOG_LEVELS.INFO;
    setLevel(level) {
        if (typeof level === 'string') {
            const upperLevel = level.toUpperCase();
            this.level = exports.LOG_LEVELS[upperLevel] ?? exports.LOG_LEVELS.INFO;
        }
        else {
            this.level = level;
        }
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const color = LOG_COLORS[level];
        const reset = LOG_COLORS.RESET;
        const formattedArgs = args.length > 0
            ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
            : '';
        return `${color}[${timestamp}] ${level}: ${message}${formattedArgs}${reset}`;
    }
    log(level, message, ...args) {
        if (exports.LOG_LEVELS[level] >= this.level) {
            console.log(this.formatMessage(level, message, ...args));
        }
    }
    debug(message, ...args) {
        this.log('DEBUG', message, ...args);
    }
    info(message, ...args) {
        this.log('INFO', message, ...args);
    }
    warn(message, ...args) {
        this.log('WARN', message, ...args);
    }
    error(message, ...args) {
        this.log('ERROR', message, ...args);
    }
}
/**
 * Singleton logger instance
 */
exports.logger = new LoggerImpl();
