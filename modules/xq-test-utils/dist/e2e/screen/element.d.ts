import type { Matcher, ElementActions } from './types';
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
export declare function getElement(matcher: Matcher): ElementActions;
