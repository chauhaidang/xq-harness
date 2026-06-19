"use strict";
/**
 * JUnit XML → Markdown test reporter.
 *
 * Implements ITestReporter so it can be swapped with other
 * report formats (HTML, JSON, etc.) in the future.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JunitMarkdownReporter = void 0;
exports.generateTestReport = generateTestReport;
const node_fs_1 = require("node:fs");
const xq_harness_common_kit_1 = require("@chauhaidang/xq-harness-common-kit");
/**
 * Generates a Markdown report from JUnit XML output.
 */
class JunitMarkdownReporter {
    async generate(options) {
        const { junitXmlPath, reportMdPath, appendMarkdown } = options;
        const xmlContent = (0, node_fs_1.readFileSync)(junitXmlPath, 'utf8');
        const markdown = await (0, xq_harness_common_kit_1.generateMarkdownFromJunit)(xmlContent);
        const fullContent = appendMarkdown ? markdown + '\n\n' + appendMarkdown : markdown;
        (0, node_fs_1.writeFileSync)(reportMdPath, fullContent);
    }
}
exports.JunitMarkdownReporter = JunitMarkdownReporter;
/**
 * Convenience function preserving the original API.
 * Delegates to JunitMarkdownReporter under the hood.
 */
async function generateTestReport(options) {
    const reporter = new JunitMarkdownReporter();
    await reporter.generate(options);
}
