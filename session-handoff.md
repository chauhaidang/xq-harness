# Session Handoff

## Current Objective

- Feature: `feat-016` — unambiguous exercise input labels
- Status: implemented and verified.
- Scope boundary: local-only data, physical-device acceptance, no simulator,
  API, account, analytics, or device E2E in CI.
- PR branch: `codex/ios-fitness-native-onboarding`, targeting `main`.

## State

- Snapshot creation retains exactly the newest two immutable captures and saves
  the bounded state atomically through the existing JSON persistence seam.
- The comparison report always uses the newest capture and its immediate
  predecessor. The host tracer proves A/B/C becomes B/C and reports C versus B.
- The newest physical-device journey captures Bench Press at 10, 20, then 15
  reps, proves First → Increased → Decreased, relaunches, and proves Decreased
  remains visible from Latest Comparison.
- `docs/product/ios-xq-fitness-app-test-coverage.md` maps product components to
  capabilities, identifies unit/UI ownership per cell, and names open gaps.
- Exercise deletion is now U+UI: the device journey swipes to delete and
  requires the empty training-day state.
- Every UI journey inherits shared setup that resets the isolated store and
  requires an empty routine list. Data-preserving relaunch is explicit.
- Exercise input rows now permanently display Exercise name, Sets, Repetitions,
  and Weight (kg); the fields retain their stable identifiers and matching
  accessibility labels.
- CI remains a generic unsigned iOS build plus host unit tests only.
- PR ready: yes. CI ready: yes.

## Verification Evidence

| Check | Result |
|---|---|
| `./scripts/module ci ios-xq-fitness-app` | pass; generic iOS build plus 17 unit tests |
| Generic UI `build-for-testing` | pass |
| Three-snapshot device tracer | pass; 1 test in 118.001 seconds |
| Visible-label tracer | pass; 1 passed, 0 failed in 33.198 seconds |
| Final reviewed device E2E | pass; 7 passed, 0 failed, 0 skipped in 298.892 seconds |
| Final four-field label tracer | pass; 1 passed, 0 failed in 33.649 seconds |
| Two-axis PR review | pass; 0 Standards blockers and 0 Spec blockers |
| Device | iPhone 12, iOS 26.5 |
| Simulator | not used and out of scope |

## Resume Instructions

1. Start with `node scripts/harness-context.mjs module ios-xq-fitness-app`.
2. Read `docs/product/ios-xq-fitness-app-test-coverage.md` and select one named
   GAP as the next feature slice.
3. Keep domain invariants and persistence in host tests; use physical-device UI
   tests for navigation, controls, visible reporting, and relaunch behavior.
4. Extend `FitnessSnapshot` only through an explicit migration and concentrate
   behavior behind `FitnessStore` commands/report queries.
5. Update the matrix with every story and verify using module CI plus the local
   device runner; do not add simulator or UI execution to CI.

## Remaining Risks

- Routine rename/delete, custom day labels, and browsing arbitrary historical
  comparisons remain explicit matrix gaps because those capabilities are not
  implemented yet.
- Free Apple development profiles limit concurrently installed development
  apps. A stale finance UI-test runner was removed earlier; the finance app and
  its data were preserved.
