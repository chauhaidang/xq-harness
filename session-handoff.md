# Session Handoff

## Current Objective

- Feature: `feat-022` — agent-native iOS UI test CLI.
- Status: implementation, 24-test Swift suite, and interactive simulator
  acceptance complete; JSON-scenario evidence and physical provisioning remain.
- TDD fixed the generated xctestrun portability bug by keeping each protected
  session file beside its cached build products and deleting it on daemon exit.
- Installed Settings passed start/map/find/tap/clear/type/assert/screenshot/stop
  on iPhone 16 simulator `61112FCA-8781-4A4C-AB6C-42007DDF483B`. Evidence is in
  session `c3d61550-29c3-4899-a47e-f799936ed622`; screenshot copy is
  `/private/tmp/xq-settings-simulator.png`.
- Physical retry on 2026-07-16 reached Xcode signing with device
  `00008150-0012058A14F8401C` but failed before test execution: the Apple account
  is missing its Xcode token and no profile exists for the generic runner.
- The correct explicit development team is `T99X93V7Y2` (certificate OU), not
  `Y57FXM29C3` from the certificate display label.
- Resume by freeing at least 1 GB without deleting source or tested-app data,
  running the JSON scenario journey, signing back into the Apple account in
  Xcode, then running the physical Settings journey.
- Required passing evidence already recorded: 24-test Swift suite, independent
  generic-host build-for-testing, skill validator, forward test, and two-axis
  review. Earlier simulator commands passed start/map/find/tap/type/assert.
- Do not modify the unrelated staged/unstaged xq-kraken work.

## Previous Objective

- Feature: `feat-021` — Behave functional tests for xq-kraken.
- Status: complete and locally verified.
- Default functional coverage uses Behave: 4 scenarios and 14 steps pass.
- Tagged workshop checkpoints use Behave and all 8 scenarios dry-run cleanly.
- Three unittest structural checks and package build pass; pytest is removed.
- Checkpoint 0 now passes after `InvocationRequest` was aligned with the guide:
  empty parameters default, optional `body`, and frozen public DTOs.
- BasedPyright is blocked by the separately staged incomplete learner file
  `kraken/client.py`; it was preserved rather than overwritten.
- Checkpoint 1 is complete: the private aiopenapi3 adapter loads/indexes the
  owned document, validates operation IDs, and returns allowlisted summaries.
- The workshop is complete as of 2026-07-18: the full Behave checkpoint suite
  passes 8 scenarios/8 steps and `tests.test_dynamic_client` passes 13 tests.
- The current KISS-oriented guide is `modules/xq-kraken/workshop.md`; temporary
  `feedback.md` and obsolete `DYNAMIC_CLIENT_GUIDE.md` were removed.
- The guide is now beginner-oriented: it explains vocabulary, file roles,
  checkpoint-1 implementation steps, later checkpoints, Behave commands,
  common failures, and final verification.
- It also documents the LLM's progressive payload workflow: compact search,
  one-operation describe, invoke envelopes, repairable validation errors, and
  strict output-size rules so Kraken is not OpenAPI rendered as JSON.
- The workshop now retains `KrakenClient` as the single small extension seam
  for a future dynamic implementation, while documenting factory ownership,
  shared allowlist behavior, and compatibility rules that prevent protocol
  sprawl.
- `modules/xq-kraken/aiopenapi3-cheat-sheet.md` is the compact reference for
  the dynamic-client learning flow: keep the raw OpenAPI mapping for catalog
  and LLM schemas; keep aiopenapi3's private typed runtime object for request
  validation, serialization, and transport. The focused workshop structural
  tests pass (3 tests) as of 2026-07-17.

## Earlier Objective

- Feature: `feat-019` — conventional xq-kraken package layout.
- Runtime code uses the `kraken` import package, ordinary tests and the owned
  fixture live under `tests`, and guided checkpoints live under `workshop`.

## Older Objective

- Feature: `feat-018` — OpenAPI extractor implementation guideline.
- Guideline: `modules/xq-kraken/openapi-extractor-guideline.md`.
- Source contract test: `modules/xq-kraken/tests/test_rest_source.py`.
- The source now loads both JSON and YAML documents successfully.

## Historical Objective

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

The project now has seven reusable custom Codex roles in `.codex/agents/`.
Use `.codex/TEAM.md` for role selection, group sequencing, multiple-instance
partitioning, and edit-ownership rules. The root agent remains responsible for
all orchestration and harness tracking. `agents.max_threads` is configured to
8 with depth 1, but runtime/account limits may impose a lower concurrency cap.
The TOML and JSON files parse, Codex strict configuration loading succeeds,
`git diff --check` passes, and `./init.sh` passes. Codex Doctor separately
reports pre-existing local state-database and provider-reachability failures.

1. Free at least 1 GB of local disk without deleting source or app data.
2. Run `node scripts/harness-context.mjs feature feat-022` and
   `./scripts/module ci xq-ios-ui-test-framework`.
3. Run the equivalent installed-Settings JSON scenario; verify screenshot,
   fail-fast diagnostics, stop, scenario report, and final XCResult artifacts.
4. Sign back into the Apple account in Xcode, then repeat the core journey on
   an unlocked physical iPhone with `--team T99X93V7Y2`; audit logs for no tested-app
   install or uninstall.
5. If both pass, mark feat-022 done and PR ready, update all three harness
   artifacts, and rerun `./init.sh`.

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
