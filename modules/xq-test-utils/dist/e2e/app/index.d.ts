export interface LaunchOptions {
    /**
     * Start a brand-new app instance, even if one is already running.
     * @default false
     */
    newInstance?: boolean;
    /**
     * Grant runtime permissions before launch.
     * Example: `{ notifications: 'YES', camera: 'NO' }`
     */
    permissions?: Record<string, string>;
    /**
     * Override launch arguments exposed to the app via ProcessInfo.
     */
    launchArgs?: Record<string, unknown>;
    /**
     * Override device language and locale.
     * Example: `{ language: 'fr', locale: 'fr_FR' }`
     */
    languageAndLocale?: {
        language?: string;
        locale?: string;
    };
}
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
export declare const App: {
    /**
     * Launches the app. Pass `{ newInstance: true }` to guarantee a fresh
     * process instead of resuming an existing one.
     */
    launch(options?: LaunchOptions): Promise<void>;
    /**
     * Deletes all app data and re-launches as a clean install.
     * Use this at the start of a suite that requires a pristine state.
     */
    reset(options?: Omit<LaunchOptions, "newInstance">): Promise<void>;
    /**
     * Terminates the running app process.
     */
    terminate(): Promise<void>;
    /**
     * Sends the app to the background for `durationMs` milliseconds, then
     * brings it back to the foreground. Useful for testing lifecycle events.
     * @param durationMs - How long to keep the app backgrounded. Default 2000.
     */
    background(durationMs?: number): Promise<void>;
    /**
     * Terminates then re-launches the app without deleting its data.
     * Useful for testing cold-start behaviour mid-suite.
     */
    relaunch(options?: LaunchOptions): Promise<void>;
};
