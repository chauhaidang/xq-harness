# US-APP-005 iOS Fitness Physical-Device E2E

## Status

implemented

## Product Contract

Add complete black-box UI coverage for the behavior delivered by the native
fitness foundation and run it locally on the dedicated iPhone.

## Acceptance Criteria

- The app owns an XCUITest target that imports the local `XQUIHarness` package.
- UI tests launch in a dedicated Application Support namespace.
- Reset requires both isolation and reset flags and cannot clear normal data.
- Shared setup resets the isolated namespace and verifies an empty routine list
  before every test body.
- Tests cover empty launch, required-name validation, cancel, creation with and
  without notes, adding a second routine, workspace navigation, relaunch
  persistence, visible exercise-input labels, exercise deletion, and reset.
- A portable local script requires environment-provided device and team IDs.
- The complete target passes on the paired physical iPhone.
- CI remains limited to unsigned generic-device build and host unit tests; no
  simulator or physical-device execution is added to CI.

## Validation

| Layer | Proof |
| --- | --- |
| Host unit | `./scripts/module test ios-xq-fitness-app` |
| CI boundary | `./scripts/module ci ios-xq-fitness-app` |
| Device E2E | `scripts/run-device-ui-tests.sh` with local environment values |
