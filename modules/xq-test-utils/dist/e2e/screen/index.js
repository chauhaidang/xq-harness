"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screen = void 0;
const matchers_1 = require("./matchers");
const element_1 = require("./element");
const expectations_1 = require("./expectations");
const web_element_1 = require("./web-element");
/**
 * The primary interaction surface for Detox E2E tests.
 *
 * `screen` provides two interaction surfaces (native and web-view), each with
 * selectors, actions, and assertions:
 *
 * **Native elements**
 * - `screen.by.*`       — build a native element matcher
 * - `screen.element(m)` — perform actions on the matched element
 * - `screen.expect(m)`  — assert the state of the matched element
 * - `screen.waitFor(m)` — wait until the element reaches a state
 *
 * **Web-view elements** (inside a `<WebView>`)
 * - `screen.webBy.*`       — build a web-view element matcher
 * - `screen.webElement(m)` — perform actions on the matched web element
 * - `screen.webExpect(m)`  — assert the state of the matched web element
 *
 * All Detox globals (`by`, `element`, `expect`, `waitFor`, `web`) are wrapped
 * internally — consumers never import or reference Detox directly.
 *
 * @example
 * import { screen } from '@chauhaidang/xq-harness-test-utils';
 *
 * // Native: fill in a form and submit
 * await screen.element(screen.by.id('email-input')).typeText('user@example.com');
 * await screen.element(screen.by.id('login-btn')).tap();
 * await screen.waitFor(screen.by.id('dashboard-header')).toBeVisible();
 *
 * // Web-view: interact with embedded web content
 * await screen.webElement(screen.webBy.id('web-email')).typeText('user@example.com');
 * await screen.webExpect(screen.webBy.cssSelector('.error')).not.toExist();
 */
exports.screen = {
    // ── Native ────────────────────────────────────────────────────────────────
    /** Native element selector builders. Start here to describe the target element. */
    by: matchers_1.by,
    /**
     * Returns an action handle for the native element described by `matcher`.
     * Actions: tap, doubleTap, longPress, typeText, replaceText,
     * clearText, scroll, scrollTo, swipe.
     */
    element: element_1.getElement,
    /**
     * Returns an assertion handle for the native element described by `matcher`.
     * Assertions: toBeVisible, toExist, toHaveText, toHaveLabel,
     * toHaveId, toHaveValue — and `.not` negations.
     */
    expect: expectations_1.expectElement,
    /**
     * Returns a wait-for handle that polls until the native element reaches the
     * expected state or the timeout expires (default 5000 ms).
     * Waits: toBeVisible, toExist, toHaveText — and `.not` negations.
     */
    waitFor: expectations_1.waitForElement,
    // ── Web-view ──────────────────────────────────────────────────────────────
    /**
     * Web-view element selector builders. Use inside a `<WebView>` context.
     * Selectors: id, className, cssSelector, name, xpath, tag, href,
     * hrefContains, value (iOS), label (iOS), type (iOS), atIndex (iOS).
     */
    webBy: matchers_1.webBy,
    /**
     * Returns an action handle for the web-view element described by `matcher`.
     * Actions: tap, typeText, replaceText, clearText, selectAllText,
     * scrollToView, focus, moveCursorToEnd, runScript, getCurrentUrl, getTitle.
     */
    webElement: web_element_1.getWebElement,
    /**
     * Returns an assertion handle for the web-view element described by `matcher`.
     * Assertions: toHaveText, toExist, toHaveValue — and `.not` negations.
     */
    webExpect: web_element_1.expectWebElement,
};
