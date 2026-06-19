import type { Matcher, ElementExpectations, ElementWaits } from './types';
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
export declare function expectElement(matcher: Matcher): ElementExpectations;
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
export declare function waitForElement(matcher: Matcher): ElementWaits;
