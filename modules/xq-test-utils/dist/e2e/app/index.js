"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const xq_harness_common_kit_1 = require("@chauhaidang/xq-harness-common-kit");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _device = () => globalThis.device;
/**
 * High-level controller for the app under test.
 * Wraps Detox's `device` global — consumers never need to import or reference
 * Detox APIs directly.
 *
 * All methods are async and log their actions via xq-common-kit logger.
 *
 * @example
 * import { App } from '@chauhaidang/xq-harness-test-utils';
 *
 * beforeAll(async () => {
 *   await App.launch({ newInstance: true });
 * });
 *
 * afterAll(async () => {
 *   await App.terminate();
 * });
 */
exports.App = {
    /**
     * Launches the app. Pass `{ newInstance: true }` to guarantee a fresh
     * process instead of resuming an existing one.
     */
    async launch(options) {
        xq_harness_common_kit_1.logger.info('[App] Launching', options ?? {});
        await _device().launchApp(options);
    },
    /**
     * Deletes all app data and re-launches as a clean install.
     * Use this at the start of a suite that requires a pristine state.
     */
    async reset(options) {
        xq_harness_common_kit_1.logger.info('[App] Resetting (fresh install)', options ?? {});
        await _device().launchApp({ ...options, newInstance: true, delete: true });
    },
    /**
     * Terminates the running app process.
     */
    async terminate() {
        xq_harness_common_kit_1.logger.info('[App] Terminating');
        await _device().terminateApp();
    },
    /**
     * Sends the app to the background for `durationMs` milliseconds, then
     * brings it back to the foreground. Useful for testing lifecycle events.
     * @param durationMs - How long to keep the app backgrounded. Default 2000.
     */
    async background(durationMs = 2000) {
        xq_harness_common_kit_1.logger.info(`[App] Backgrounding for ${durationMs}ms`);
        await _device().sendToHome();
        await new Promise((resolve) => setTimeout(resolve, durationMs));
        await _device().activateApp();
        xq_harness_common_kit_1.logger.info('[App] Restored to foreground');
    },
    /**
     * Terminates then re-launches the app without deleting its data.
     * Useful for testing cold-start behaviour mid-suite.
     */
    async relaunch(options) {
        xq_harness_common_kit_1.logger.info('[App] Relaunching (terminate + launch)', options ?? {});
        await _device().terminateApp();
        await _device().launchApp(options);
    },
};
