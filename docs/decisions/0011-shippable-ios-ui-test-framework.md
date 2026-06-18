# 0011 Shippable iOS UI Test Framework Boundary

Date: 2026-06-18

## Status

Accepted

## Context

Native and React Native iOS applications need reusable XCUITest mechanics and
consistent physical-device reporting without coupling the framework release to
one application's bundle IDs, storage, screens, or journeys.

## Decision

Publish `modules/xq-ios-ui-test-framework` as a Swift Package with a generic
`XQUIHarness` library and `xq-ui-test` executable. Consumer repositories own
all application-specific identifiers, screen objects, launch behavior, data
isolation, and journeys.

The CLI uses schema-versioned JSON, structured `devicectl` discovery, signed IPA
validation, update-style installation without uninstall, physical-device
`xcodebuild`, XCResult, xcbeautify JUnit, raw logs, metadata, and authoritative
exit propagation. V1 runs iPhones serially without automatic retry.

The monorepo remains the source of truth. Release tags subtree-split the package
to the private `chauhaidang/xq-ios-ui-test-framework` distribution repository
and create immutable semantic tags. Pre-1.0 consumers use `.upToNextMinor`.

## Alternatives Considered

1. Keep a central Xcode UI-test project containing app journeys. Rejected
   because app targets, signing, identifiers, and behavior belong with each app.
2. Use YAML configuration. Rejected to avoid adding a parser dependency.
3. Uninstall before every test run. Rejected because it destroys application
   state and cannot validate update behavior.
4. Adopt a third-party black-box runner as the core. Deferred; XCUITest provides
   the required native device, signing, XCResult, and XCTest integration.

## Consequences

Positive:

- Native and React Native consumers can import one versioned package while
  independently owning their suites.
- Device and report behavior is consistent and testable outside app code.
- Normal app data is protected from UI-test resets by a consumer contract.

Tradeoffs:

- Every consumer must add an XCUITest target and stable accessibility IDs.
- Private Git authentication and Apple signing remain external prerequisites.
- Device execution is serial and provisioning may contact Apple services.

## Follow-Up

- Configure release and read-only consumer credentials outside the repository.
- Integrate the future React Native app as a separate consumer-owned suite.
- Consider parallel devices and opt-in retry policy after V1 evidence exists.
