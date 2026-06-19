# US-APP-003 Shippable iOS UI Test Framework

## Status

implemented

## Lane

high-risk

## Product Contract

Ship a reusable, product-agnostic Swift XCUITest package and physical-device
runner, with XQ Finance as the first consumer-owned suite.

## Relevant Product Docs

- `docs/product/ios-ui-test-framework.md`
- `docs/product/ios-xq-finance-app.md`

## Acceptance Criteria

- The package exports `XQUIHarness` and `xq-ui-test` without product identifiers
  or business journeys.
- The CLI validates signed IPAs, update-installs without uninstalling, runs a
  selected suite on a physical iPhone, and emits XCResult, JUnit, logs, metadata,
  and screenshots with authoritative exit status.
- XQ Finance owns its UI-test target, scheme, identifiers, screen objects, and
  portfolio lifecycle suite.
- XQ UI-test storage and Keychain state are isolated from normal app data, and
  reset cannot delete the normal namespace.
- CI validates the package and consumer compilation; tagged release automation
  publishes a subtree mirror with immutable semantic tags.

## Design Notes

- Commands: `xq-ui-test preflight`, `xq-ui-test devices`, `xq-ui-test run`.
- Queries: structured `xcrun devicectl list devices --json-output`.
- API: `ApplicationDescriptor`, `LaunchConfiguration`, `BaseUITestCase`, element helpers.
- Tables: none.
- Domain rules: consumer owns all app behavior; runner never uninstalls.
- UI surfaces: none in the framework; XQ Finance owns XCUITest screen objects.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | `swift test` in `modules/xq-ios-ui-test-framework`; `./scripts/module test ios-xq-finance-app` |
| Integration | XQ UI-test target build-for-testing against the local package path |
| E2E | `xq-ui-test run` lifecycle suite on physical iPhone |
| Platform | Signed IPA archive/export, update install, XCResult/JUnit/log/metadata/screenshot audit |
| Release | Workflow validates version and subtree split before push/tag/release |

## Repository Delta

Register a non-`test_all` Swift module and add dedicated macOS CI and subtree
release workflows.

## Evidence

- Framework `swift test`: 13 tests, 0 failures.
- XQ UI-test consumer build-for-testing: `** TEST BUILD SUCCEEDED **`.
- XQ unit-test scheme passed after storage isolation tests were added.
- Archive and IPA export completed with `** EXPORT SUCCEEDED **`.
- Physical device `00008101-000E548E34F0001E`: lifecycle suite passed in
  59.579 seconds, then passed again with the retained success screenshot.
- Final run `2026-06-18T15-46-58Z` emitted status 0, `result.xcresult`,
  `junit.xml`, `xcodebuild.log`, `xcbeautify.log`, `run-metadata.json`, and the
  `Persisted portfolio after relaunch` screenshot attachment.
- CLI tests prove missing IPA, bundle mismatch, invalid signature, installation
  failure, multi-device selection, report generation, no uninstall command,
  suite construction, and exit-code propagation.
