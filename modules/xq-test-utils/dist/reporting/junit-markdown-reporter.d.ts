/**
 * JUnit XML → Markdown test reporter.
 *
 * Implements ITestReporter so it can be swapped with other
 * report formats (HTML, JSON, etc.) in the future.
 */
import { GenerateTestReportOptions, ITestReporter } from './types';
/**
 * Generates a Markdown report from JUnit XML output.
 */
export declare class JunitMarkdownReporter implements ITestReporter {
    generate(options: GenerateTestReportOptions): Promise<void>;
}
/**
 * Convenience function preserving the original API.
 * Delegates to JunitMarkdownReporter under the hood.
 */
export declare function generateTestReport(options: GenerateTestReportOptions): Promise<void>;
