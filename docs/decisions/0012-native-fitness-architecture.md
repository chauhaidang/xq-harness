# 0012 Native Fitness Architecture

Date: 2026-07-13

## Status

Accepted

## Context

The imported Expo fitness app is becoming a native iPhone application. The
first native releases are offline-only, run on a dedicated physical device, and
must leave room for later API synchronization without putting networking into
the current product boundary.

## Decision

Build `ios-xq-fitness-app` in SwiftUI using MVVM plus a small app router.
`AppRouter` owns navigation paths and sheet destinations. Feature view models
own editing and validation state only where it adds behavior. SwiftUI views own
transient presentation state.

Keep domain rules and mutations behind a deep `FitnessStore` interface using
commands and versioned `FitnessSnapshot` values. Inject `FitnessPersisting` at
the store boundary. Production uses atomic JSON in Application Support plus a
local recovery snapshot; tests use an in-memory adapter. API synchronization is
deferred behind a future store-owned interface.

CI runs an unsigned generic-iOS build and host-side unit tests. Simulator,
signed-device, integration-service, and API workflows are not CI gates.

## Alternatives Considered

1. MVC-P. Rejected because presenter/view contracts add ceremony around
   SwiftUI's state-driven rendering and make navigation ownership less direct.
2. One view model per view. Rejected because it creates shallow pass-through
   types instead of concentrating domain behavior in the store.
3. SwiftData as the first persistence implementation. Deferred because a
   versioned Codable snapshot is easier to migrate, recover, and test for this
   compact offline data graph.

## Consequences

Positive:

- Domain behavior can be unit-tested on the host without a simulator.
- Navigation has one owner and feature sheets remain explicit.
- A future API adapter can synchronize through the store without rewriting
  views.

Tradeoffs:

- Cross-file persistence is recoverable but not transactionally atomic as a
  pair; the primary snapshot remains authoritative.
- Physical-device UI acceptance remains a local step.
- Later workout and report slices must extend snapshot migrations carefully.

The first extension uses `FitnessSnapshot` schema version 2. Every routine is
normalized to seven stable day identities at the store seam. Exercise mutations
and immutable snapshot capture remain store commands. Snapshot reports compare
the newest capture only with its immediate predecessor; duplicate exercise
names across days are aggregated by case-insensitive name using the highest
sets, reps, and weight, retaining the old app's First/Increased/Decreased/Same
indicator vocabulary without retaining its API dependency.
Each successful capture atomically bounds the routine to its newest two
snapshots, which is the complete state required for immediate-previous reports.
