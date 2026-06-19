"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebElement = getWebElement;
exports.expectWebElement = expectWebElement;
const xq_harness_common_kit_1 = require("@chauhaidang/xq-harness-common-kit");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _webEl = (matcher) => globalThis.web.element(matcher);
/**
 * Returns an interaction handle for the web-view element matched by `matcher`.
 * All actions are logged via xq-common-kit logger for debugging.
 *
 * Use `screen.webBy.*` to build the matcher, then pass it here.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * await screen.webElement(screen.webBy.id('username')).typeText('alice');
 * await screen.webElement(screen.webBy.cssSelector('button.submit')).tap();
 */
function getWebElement(matcher) {
    return {
        async tap() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] tap', { matcher });
            await _webEl(matcher).tap();
        },
        async typeText(text) {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] typeText', { matcher, text });
            await _webEl(matcher).typeText(text);
        },
        async replaceText(text) {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] replaceText', { matcher, text });
            await _webEl(matcher).replaceText(text);
        },
        async clearText() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] clearText', { matcher });
            await _webEl(matcher).clearText();
        },
        async selectAllText() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] selectAllText', { matcher });
            await _webEl(matcher).selectAllText();
        },
        async scrollToView() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] scrollToView', { matcher });
            await _webEl(matcher).scrollToView();
        },
        async focus() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] focus', { matcher });
            await _webEl(matcher).focus();
        },
        async moveCursorToEnd() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] moveCursorToEnd', { matcher });
            await _webEl(matcher).moveCursorToEnd();
        },
        async runScript(script) {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] runScript', { matcher });
            return _webEl(matcher).runScript(script);
        },
        async getCurrentUrl() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] getCurrentUrl');
            return _webEl(matcher).getCurrentUrl();
        },
        async getTitle() {
            xq_harness_common_kit_1.logger.debug('[screen.webElement] getTitle');
            return _webEl(matcher).getTitle();
        },
    };
}
/**
 * Returns an assertion handle for the web-view element matched by `matcher`.
 * Wraps Detox's `web.element().expect()` — consumers never call Detox APIs directly.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * await screen.webExpect(screen.webBy.id('error-msg')).toHaveText('Invalid email');
 * await screen.webExpect(screen.webBy.cssSelector('.spinner')).not.toExist();
 */
function expectWebElement(matcher) {
    const build = (negated) => {
        const base = () => (negated ? _webEl(matcher).not : _webEl(matcher));
        const assertions = {
            async toHaveText(text) {
                xq_harness_common_kit_1.logger.debug('[screen.webExpect] toHaveText', { negated, text });
                await base().toHaveText(text);
            },
            async toExist() {
                xq_harness_common_kit_1.logger.debug('[screen.webExpect] toExist', { negated });
                await base().toExist();
            },
            async toHaveValue(value) {
                xq_harness_common_kit_1.logger.debug('[screen.webExpect] toHaveValue', { negated, value });
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
