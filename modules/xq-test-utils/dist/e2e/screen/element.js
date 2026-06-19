"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElement = getElement;
const xq_harness_common_kit_1 = require("@chauhaidang/xq-harness-common-kit");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _el = (matcher) => globalThis.element(matcher);
/**
 * Returns an interaction handle for the element matched by `matcher`.
 * All actions are logged via xq-common-kit logger for debugging.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * await screen.element(screen.by.id('submit-btn')).tap();
 * await screen.element(screen.by.id('email-input')).typeText('user@example.com');
 * await screen.element(screen.by.id('feed')).scroll(300, 'down');
 */
function getElement(matcher) {
    return {
        async tap() {
            xq_harness_common_kit_1.logger.debug('[screen] tap', { matcher });
            await _el(matcher).tap();
        },
        async doubleTap() {
            xq_harness_common_kit_1.logger.debug('[screen] doubleTap', { matcher });
            await _el(matcher).multiTap(2);
        },
        async longPress(durationMs) {
            xq_harness_common_kit_1.logger.debug('[screen] longPress', { matcher, durationMs });
            await _el(matcher).longPress(undefined, durationMs);
        },
        async typeText(text) {
            xq_harness_common_kit_1.logger.debug('[screen] typeText', { matcher, text });
            await _el(matcher).typeText(text);
        },
        async replaceText(text) {
            xq_harness_common_kit_1.logger.debug('[screen] replaceText', { matcher, text });
            await _el(matcher).replaceText(text);
        },
        async clearText() {
            xq_harness_common_kit_1.logger.debug('[screen] clearText', { matcher });
            await _el(matcher).clearText();
        },
        async scroll(pixels, direction = 'down') {
            xq_harness_common_kit_1.logger.debug('[screen] scroll', { matcher, pixels, direction });
            await _el(matcher).scroll(pixels, direction);
        },
        async scrollTo(edge) {
            xq_harness_common_kit_1.logger.debug('[screen] scrollTo', { matcher, edge });
            await _el(matcher).scrollTo(edge);
        },
        async swipe(direction, speed = 'fast', normalizedOffset = 0.75) {
            xq_harness_common_kit_1.logger.debug('[screen] swipe', { matcher, direction, speed, normalizedOffset });
            await _el(matcher).swipe(direction, speed, normalizedOffset);
        },
    };
}
