# US-APP-001 iOS Finance App Module

## Status

implemented

## Lane

normal

## Product Contract

Create the native iOS module that will host the XQ finance app without adding
finance data behavior, authentication, persistence, or external integrations.

## Relevant Product Docs

- `docs/product/ios-xq-finance-app.md`

## Acceptance Criteria

- `ios-xq-finance-app` is registered in `modules.yaml`.
- The module contains an XcodeGen project definition for a SwiftUI iOS app.
- The app launches to a minimal `XQ Finance` overview surface.
- A unit test proves the default launch summary.
- The module can be addressed by `./scripts/module info ios-xq-finance-app`.

## Design Notes

- Commands: none.
- Queries: none.
- API: none.
- Tables: none.
- Domain rules: only launch summary copy exists in this slice.
- UI surfaces: SwiftUI iOS application shell.
- Brand assets: AppIcon asset catalog with a friendly `XQ` pocket-monogram mark.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | `./scripts/module test ios-xq-finance-app` |
| Integration | Not applicable for this scaffold. |
| E2E | Not applicable for this scaffold. |
| Platform | `./scripts/module build ios-xq-finance-app` |
| Release | Not applicable until distribution is defined. |

## Evidence

- `xcodegen generate` created `modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj`.
- `./scripts/module info ios-xq-finance-app` passed and reported version `0.1.0`, no dependencies, and `test_all: false`.
- `./scripts/module build ios-xq-finance-app` passed with `** BUILD SUCCEEDED **`.
- `./scripts/module test ios-xq-finance-app` passed with 1 XCTest and 0 failures.
- `./scripts/module build ios-xq-finance-app` passed after adding the AppIcon
  asset catalog and compiling it through Xcode's asset tool.
