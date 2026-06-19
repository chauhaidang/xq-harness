"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectElement = expectElement;
exports.waitForElement = waitForElement;
const xq_harness_common_kit_1 = require("@chauhaidang/xq-harness-common-kit");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _expect = (matcher) => globalThis.expect(globalThis.element(matcher));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _waitFor = (matcher) => globalThis.waitFor(globalThis.element(matcher));
const DEFAULT_TIMEOUT = 5_000;
/**
 * Returns an assertion handle for the element matched by `matcher`.
 * Wraps Detox's `expect()` — consumers never call Detox APIs directly.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * await screen.expect(screen.by.id('welcome')).toBeVisible();
 * await screen.expect(screen.by.id('error-banner')).not.toBeVisible();
 * await screen.expect(screen.by.id('title')).toHaveText('Home');
 */
function expectElement(matcher) {
    const build = (negated) => {
        const base = () => (negated ? _expect(matcher).not : _expect(matcher));
        const assertions = {
            async toBeVisible(percent) {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toBeVisible', { negated, percent });
                await base().toBeVisible(percent);
            },
            async toExist() {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toExist', { negated });
                await base().toExist();
            },
            async toHaveText(text) {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toHaveText', { negated, text });
                await base().toHaveText(text);
            },
            async toHaveLabel(label) {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toHaveLabel', { negated, label });
                await base().toHaveLabel(label);
            },
            async toHaveId(id) {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toHaveId', { negated, id });
                await base().toHaveId(id);
            },
            async toHaveValue(value) {
                xq_harness_common_kit_1.logger.debug('[screen.expect] toHaveValue', { negated, value });
                await base().toHaveValue(value);
            },
            get not() {
                return build(true);
            },
        };
        return assertions;
    };
    return build(false);
}
/**
 * Returns a wait-for handle for the element matched by `matcher`.
 * Wraps Detox's `waitFor()` — consumers never call Detox APIs directly.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * // Wait up to 5 s for a spinner to disappear
 * await screen.waitFor(screen.by.id('spinner')).not.toExist();
 *
 * // Custom timeout
 * await screen.waitFor(screen.by.id('dashboard')).toBeVisible({ timeout: 10_000 });
 */
function waitForElement(matcher) {
    const build = (negated) => {
        const base = () => (negated ? _waitFor(matcher).not : _waitFor(matcher));
        const waits = {
            async toBeVisible({ timeout = DEFAULT_TIMEOUT } = {}) {
                xq_harness_common_kit_1.logger.debug('[screen.waitFor] toBeVisible', { negated, timeout });
                await base().toBeVisible().withTimeout(timeout);
            },
            async toExist({ timeout = DEFAULT_TIMEOUT } = {}) {
                xq_harness_common_kit_1.logger.debug('[screen.waitFor] toExist', { negated, timeout });
                await base().toExist().withTimeout(timeout);
            },
            async toHaveText(text, { timeout = DEFAULT_TIMEOUT } = {}) {
                xq_harness_common_kit_1.logger.debug('[screen.waitFor] toHaveText', { negated, text, timeout });
                await base().toHaveText(text).withTimeout(timeout);
            },
            get not() {
                return build(true);
            },
        };
        return waits;
    };
    return build(false);
}
