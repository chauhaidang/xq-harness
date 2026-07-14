# US-APP-004 iOS Fitness Native Foundation

## Status

implemented

## Product Contract

Create the native offline foundation for XQ Fitness and migrate the first
empty-state-to-create-routine journey from the Expo reference application.

## Relevant Docs

- `docs/product/ios-xq-fitness-app.md`
- `docs/decisions/0012-native-fitness-architecture.md`

## Acceptance Criteria

- `ios-xq-fitness-app` is registered in `modules.yaml`.
- SwiftUI uses MVVM plus a router-owned `NavigationStack` and sheet destination.
- A deep `FitnessStore` validates and atomically publishes routine mutations.
- First launch is empty and users can create a named routine with optional notes.
- A versioned JSON snapshot and recovery file persist data locally.
- Unit tests cover empty launch, validation, save rollback, and recovery.
- CI builds generic iOS and runs unit tests only; it never invokes a simulator.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | `./scripts/module test ios-xq-fitness-app` |
| Platform | `./scripts/module build ios-xq-fitness-app` |
| CI | `./scripts/module ci ios-xq-fitness-app` |
| Device UI | Local-only, deferred until the dedicated iPhone is visible |
