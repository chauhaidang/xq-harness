"use strict";
/**
 * Factory for creating database helpers.
 *
 * Centralises construction so consumers don't need to know
 * which concrete class to instantiate.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseHelper = createDatabaseHelper;
const postgres_helper_1 = require("./postgres-helper");
/**
 * Create a database helper instance.
 * Currently only 'postgres' is supported; new adapters can be added
 * here without changing consumer code.
 */
function createDatabaseHelper(config) {
    return new postgres_helper_1.PostgresDatabaseHelper(config);
}
