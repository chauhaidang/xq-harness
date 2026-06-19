"use strict";
/**
 * Wait for a service URL to become available (e.g. health check endpoint).
 * Uses wait-on under the hood for polling.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForService = waitForService;
const wait_on_1 = __importDefault(require("wait-on"));
/**
 * Wait until the given URL is reachable (HTTP 2xx or TCP open).
 * @param healthUrl - URL to poll (e.g. http://localhost:8080/health)
 * @param options - Optional timeout and interval
 * @throws If the resource is not ready within the timeout
 */
async function waitForService(healthUrl, options) {
    const timeout = options?.timeout ?? 30000;
    const interval = options?.interval ?? 1000;
    await (0, wait_on_1.default)({
        resources: [healthUrl],
        timeout,
        interval,
    });
}
