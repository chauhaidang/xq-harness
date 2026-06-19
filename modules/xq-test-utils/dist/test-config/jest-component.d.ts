/**
 * Jest config factory for component/integration tests.
 * Returns a config that can be merged with or used as jest.config.component.js.
 */
import type { Config } from 'jest';
export interface ComponentTestConfigOptions {
    rootDir?: string;
    testMatch: string | string[];
    setupPath: string;
    teardownPath: string;
    helpersPath?: string;
    tsconfigPath?: string;
    testTimeout?: number;
    displayName?: string;
}
export declare function getComponentTestConfig(options: ComponentTestConfigOptions): Config;
