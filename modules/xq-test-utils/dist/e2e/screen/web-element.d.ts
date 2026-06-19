import type { WebMatcher, WebElementActions, WebElementExpectations } from './types';
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
export declare function getWebElement(matcher: WebMatcher): WebElementActions;
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
export declare function expectWebElement(matcher: WebMatcher): WebElementExpectations;
