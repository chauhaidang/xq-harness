# Session Handoff

## Current Objective

- Feature: `feat-018` — OpenAPI extractor implementation guideline
- Follow-up test: `modules/xq-kraken/tests/test_rest_source.py` now defines the
  file-path `ApiSource` contract for `RestApiSource`; it is intentionally red
  until `RestApiSource.load` is implemented.
- Status: implemented and verified as documentation-only.
- Added `modules/xq-kraken/docs/openapi-extractor-guideline.md`.
- The guideline is grounded in `API_CATALOG_CONTRACT.md`,
  `OPENAPI_CATALOG_HANDOFF.md`, and the existing xq-kraken test fixtures. It
  covers extraction flow, catalog models, parameter precedence, required
  `operationId`, raw schemas, responsibility boundaries, helper structure,
  examples, tests, verification, and v1 non-goals.
- No xq-kraken source implementation was added.

## Previous Objective

- Feature: `feat-017` — local signed IPA deployment helper
- Status: implemented and verified.
- Scope boundary: local-only data, physical-device acceptance, no simulator,
  API, account, analytics, or device E2E in CI.
- PR branch: `codex/ios-fitness-native-onboarding`, targeting `main`.
- PR #24: https://github.com/chauhaidang/xq-harness/pull/24 was squash-merged
  into `main` at `1468e25579fc608e715142cec2fead885f0f0ca6` after all eight
  checks passed.
- PR scope is native-only. Exclude the blocked `xq-fitness-mobile` import and
  workflow, `modules/ios-xq-finance-app/typescript`,
  `scripts/check-module-version-changes.js`, and unrelated `xq-scripts` hunks.

## State

- Native CI is repaired and merged: `.github/workflows/ci-ios-xq-fitness-app.yml`
  uses `macos-15` with Xcode 16.4 while remaining build-and-unit-test only.
- The final local dashboard check, filtered to the PR branch, showed eight
  visible `signal-success` results and no active or failed signals.

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
- Signed IPA deployment is now proven end-to-end: Xcode 26.0.1 archived and
  exported the app, the profile included `00008150-0012058A14F8401C`, and
  CoreDevice installed and launched it successfully. Output:
  `modules/ios-xq-fitness-app/build/ipa/ios-xq-fitness-app.ipa`.
- The legacy XQ Fitness logo is now the native app icon. The updated IPA
  installed successfully; automatic launch was denied only because the target
  phone was locked.
- Training days now display Monday, Tuesday, Wednesday, Thursday, Friday,
  Saturday, and Sunday. Stable numeric day IDs remain the persistence seam, and
  legacy `Day N` names are normalized to weekday names.
- `modules/ios-xq-fitness-app/scripts/build-device-ipa.sh` archives and exports a
  signed development IPA, installs and launches it through CoreDevice, and
  defaults to hardware UDID `00008150-0012058A14F8401C`, accepts a CoreDevice
  UUID override, and uses `IOS_PROVISIONING_DEVICE_ID` for profile validation.
  `DEVELOPMENT_TEAM` is optional when signing is configured in the existing
  Xcode project. The script no longer regenerates the project, preserving Xcode
  signing settings.
- PR ready: yes. CI ready: yes.

## Verification Evidence

| Check | Result |
|---|---|
| `./init.sh` | pass |
| `node scripts/harness-context.mjs summary` | pass |
| `git diff --check` | pass |
| Documentation/fixture inspection | pass |
| xq-kraken implementation tests | intentionally not run; implementation remains a later slice |

| Check | Result |
|---|---|
| `./scripts/module ci ios-xq-fitness-app` | pass; generic iOS build plus 17 unit tests |
| `bash -n .../build-device-ipa.sh` and `--help` | pass |
| `./init.sh` | pass |
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
2. For a signed device build, provide `DEVELOPMENT_TEAM` and run
   `modules/ios-xq-fitness-app/scripts/build-device-ipa.sh`.
3. For product work, read `docs/product/ios-xq-fitness-app-test-coverage.md`
   and select one named GAP as the next feature slice.
4. Keep domain invariants and persistence in host tests; use physical-device UI
   tests for navigation, controls, visible reporting, and relaunch behavior.

## Remaining Risks

- Routine rename/delete, custom day labels, and browsing arbitrary historical
  comparisons remain explicit matrix gaps because those capabilities are not
  implemented yet.
- Free Apple development profiles limit concurrently installed development
  apps. A stale finance UI-test runner was removed earlier; the finance app and
  its data were preserved.
- `feat-010` remains blocked on Expo physical-device acceptance and is retained
  only as the frozen behavior reference.
- Preserve unrelated dirty files under `modules/ios-xq-finance-app/typescript`
  and `scripts/check-module-version-changes.js`.

## Latest UI Follow-up

The visible numeric day badges were replaced with `MON` through `SUN`; full
weekday names remain the row labels. Direct native build and all 17 host tests
passed on 2026-07-15.

The IPA helper now defaults to project team `T99X93V7Y2`, passes it explicitly to
Xcode, supports overrides, and never regenerates the project. Default-team
archive/export and provisioning validation passed; the later CoreDevice install
wait was stopped after the IPA was ready.
