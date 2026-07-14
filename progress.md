# Session Progress Log

## Current State

**Last Updated:** 2026-07-15 00:35 +07
**Session ID:** current-thread  
**Active Feature:** feat-018 - OpenAPI extractor implementation guideline

## 2026-07-15 RestApiSource Contract Test Session

### Before State

- `src/xq_kraken/model/rest.py` contains a placeholder `RestApiSource` with an
  incomplete `load` method.
- No test covered loading an OpenAPI document from a file path through the
  `ApiSource` protocol shape.
- The checkout contains unrelated existing changes; those paths are preserved.

### After State

- Added `modules/xq-kraken/tests/test_rest_source.py`.
- The test writes a JSON OpenAPI document to a temporary file, passes its
  `Path` through an `ApiSource`-typed helper, and asserts the loaded mapping is
  unchanged.
- No production implementation was added; the test is intentionally a red
  contract test for the next implementation slice.

### Regression Test Results

- `./init.sh` from the monorepo root - pass.
- `node scripts/harness-context.mjs summary` - pass.
- `python -m py_compile tests/test_rest_source.py` - pass.
- `git diff --check` - pass.
- `PYTHONPATH=src/xq_kraken python -m unittest discover -s tests -p 'test_rest_source.py'` - fails as expected because `RestApiSource.load` is currently syntactically incomplete.
- `./scripts/module test xq-kraken` - unavailable because `xq-kraken` is not registered in `modules.yaml`.

### PR Ready

- Status: no; the new test is reviewable, but the covered production class is not implemented.

### CI Ready

- Status: no for this test slice; the focused test must pass after `RestApiSource.load` is implemented.

## 2026-07-15 OpenAPI Extractor Guideline Session

### Before State

- `modules/xq-kraken` had an explicit `API_CATALOG_CONTRACT.md`, an
  implementation handoff, and RED tests describing the future extractor,
  repository, ingestion, and request-builder seams.
- No extractor implementation was requested or added in this session.
- The checkout contained unrelated existing changes; those paths were
  preserved.

### After State

- Added `modules/xq-kraken/docs/openapi-extractor-guideline.md`.
- The guideline documents the OpenAPI document → `ApiCatalog` flow, catalog
  model responsibilities, metadata, servers, paths, operations, parameters,
  request bodies, responses, required `operationId`, parameter precedence, raw
  schema preservation, separated responsibilities, private helpers, examples,
  test cases, verification commands, and v1 non-goals.
- No xq-kraken source implementation was added or changed by this session.

### Regression Test Results

- `pwd` - pass; work started in `modules/xq-kraken`.
- `./init.sh` - pass from the monorepo root.
- `node scripts/harness-context.mjs summary` - pass.
- `node scripts/harness-context.mjs feature active` - pass; prior active
  feature `feat-017` was already done.
- `git diff --check` - pass after adding the guideline.
- Scoped standards/spec self-review - pass; the guideline stays within the
  requested documentation-only scope and all requested topics are represented
  by explicit sections or examples.
- Documentation fixture/structure inspection - pass; examples and commands
  were checked against `API_CATALOG_CONTRACT.md`,
  `OPENAPI_CATALOG_HANDOFF.md`, and the xq-kraken tests.
- The xq-kraken RED test suite was not run because this was explicitly a
  documentation-only change and the handoff states those tests are expected
  to remain RED until a later implementation slice.

### PR Ready

- Status: yes for the documentation-only scope.
- Reason: the new guideline is isolated, reviewable, and does not alter source
  behavior or the unrelated dirty paths.

### CI Ready

- Status: yes for the documentation-only scope.
- Reason: repository startup verification and whitespace validation passed;
  implementation tests remain a later xq-kraken feature concern.

## 2026-07-14 Local IPA Packaging Session

### Before State

- `ios-xq-fitness-app` had an unsigned generic-device CI build and a physical-device UI-test runner, but no module-local IPA archive/export/install helper.
- The requested device is `00008150-0012058A14F8401C`; signing requires a locally available Apple development team and provisioning profile.
- Unrelated dirty checkout paths were preserved.

### After State

- Added `modules/ios-xq-fitness-app/scripts/build-device-ipa.sh`.
- The script defaults to hardware UDID `00008150-0012058A14F8401C`, archives with automatic development signing, exports an IPA, validates the device in the provisioning profile, installs it with CoreDevice, and launches it by default.
- `INSTALL_TO_DEVICE=0`, `LAUNCH_ON_DEVICE=0`, `IOS_DEVICE_ID`, `IOS_PROVISIONING_DEVICE_ID`, archive, and export paths are supported overrides; `IOS_DEVICE_ID` may be a CoreDevice UUID.
- Removed `xcodegen generate` from the deployment path so the script preserves signing configured in the existing Xcode project; `DEVELOPMENT_TEAM` is now an optional override.

### Regression Test Results

- `bash -n modules/ios-xq-fitness-app/scripts/build-device-ipa.sh` - pass.
- `modules/ios-xq-fitness-app/scripts/build-device-ipa.sh --help` - pass.
- `git diff --check` - pass.
- `./scripts/module ci ios-xq-fitness-app` - pass; unsigned generic iOS build and 17/17 host tests.
- `./init.sh` - pass.
- Updated device targeting after CoreDevice reported David as `588EB7AC-5A43-4674-921B-634E209B39FA`; syntax, help, and startup checks pass.
- Removed signing-destructive project regeneration; syntax/help/startup checks pass after the fix.
- Signed archive attempt for David - failed before compilation: Xcode reported `No Account for Team "Y57FXM29C3"` and no development provisioning profile for `com.xq.fitness.ios-xq-fitness-app`.
- Successful signed build/deploy after clearing the stale `DEVELOPMENT_TEAM` shell override: archive and export passed, the profile included `00008150-0012058A14F8401C`, and CoreDevice installed/launched the app. IPA: `modules/ios-xq-fitness-app/build/ipa/ios-xq-fitness-app.ipa`.
- Signed archive/export/install was not run because it requires the user's Apple team/account provisioning state; the script performs device/profile checks before installation.
- A signed archive was attempted on 2026-07-14 and remains blocked by missing Xcode account/profile credentials; device install was not reached.
- Final signed archive/export/install/launch passed on 2026-07-15 using Xcode 26.0.1 and device `00008150-0012058A14F8401C`.
- Legacy logo deployment: signed archive/export passed, the updated IPA installed successfully on `00008150-0012058A14F8401C`, and launch was denied because the device was locked. Unlock the phone and launch manually or rerun the script.
- Weekday labels: new and legacy routines now display Monday through Sunday; stable numeric day IDs/order remain unchanged, and UI/unit coverage was updated.
- Weekday regression checks: direct unsigned native build passed with `actool` compiling `App/Assets.xcassets`; `./scripts/module test ios-xq-fitness-app` passed all 17 host tests; `git diff --check` and JSON validation passed.

### PR Ready

- Status: yes for this scoped helper; docs and module-local script are reviewable and unrelated dirty files remain untouched.

### CI Ready

- Status: yes; CI remains unsigned build plus host tests, and the signed device workflow is explicitly local-only.

## Change Checkpoints

### Before State

- Draft PR #24 was mergeable but `UNSTABLE` because `CI ios-xq-fitness-app / build-and-unit-test` failed before compilation.
- The workflow combined the floating `macos-latest` runner with pinned Xcode 16.2; the allocated image could select Xcode but reported that its required iOS 18.2 platform was unavailable.
- Seven other PR checks passed, and local native build, 17 host tests, and 7 physical-device journeys were already green.
- Unrelated Expo, finance TypeScript, release-script, and shared-document changes remained dirty locally and were explicitly outside the native PR.

### After State

- Native CI now uses the deterministic `macos-15` plus Xcode 16.4 pairing and still runs only `./scripts/module ci ios-xq-fitness-app`.
- Local generic-device build and all 17 host tests pass; simulator and physical-device UI execution remain local-only.
- GitHub reran all eight PR checks successfully, and the local observability dashboard showed eight `signal-success` results when filtered to `codex/ios-fitness-native-onboarding`.
- PR #24 was squash-merged into `main` at `1468e25579fc608e715142cec2fead885f0f0ca6`; unrelated dirty paths were not committed or merged.

### Regression Test Results

- Initial GitHub native CI - failed before compilation with exit 70 because the Xcode 16.2 selection lacked the usable iOS 18.2 platform on the allocated `macos-latest` image.
- `./scripts/module ci ios-xq-fitness-app` after the CI repair - pass; unsigned generic iOS build and 17/17 host tests passed.
- Workflow YAML parse plus `git diff --check` - pass.
- Parallel standards/spec review of `feaee62...0342051` - pass; zero findings on both axes and no unrelated committed changes.
- GitHub PR checks for `0342051` - pass; all 8 completed successfully, including native `build-and-unit-test` in 1m45s.
- Local XQ Workflow Observatory - pass; branch-filtered view contained exactly 8 visible workflow signals, all with `signal-success`, and no active or failed signal.
- GitHub merge confirmation - pass; PR #24 is `MERGED` at squash commit `1468e25579fc608e715142cec2fead885f0f0ca6`.
- RED visible-label device tracer - failed as intended because `fitness.exercise-editor.name-label` did not appear.
- GREEN visible-label device tracer - pass; 1 passed, 0 failed in 33.198 seconds on iPhone 12 / iOS 26.5.
- Complete clean-state physical-device suite - pass; XCResult reports 7 passed, 0 failed, 0 skipped in 278.173 seconds.
- Generic UI `build-for-testing` - pass after the labeled Form change.
- `./scripts/module ci ios-xq-fitness-app` - pass; unsigned generic iOS build and all 17 host tests passed. No E2E test runs in CI.
- Final PR device suite after review fixes - pass; exact field labels, matching accessibility labels, and exact Day 1–7 rows are covered; XCResult reports 7 passed, 0 failed, 0 skipped in 298.892 seconds.
- Final PR module CI on 2026-07-14 - pass; unsigned generic iOS build and 17/17 host tests.
- Two-axis PR review - initial native findings resolved: removed the committed team identifier, added the required module README, matched the weight accessibility label, and strengthened exact-label and all-seven-day assertions.
- Final four-field accessibility tracer - pass in 33.649 seconds; all visible and field-level labels match exactly.
- Final two-axis native-only re-review - pass; 0 Standards blockers and 0 Spec blockers.
- RED generic UI build - failed as intended because `TrainingDayScreen` did not expose delete or empty-state behavior.
- GREEN generic UI `build-for-testing` - pass after adding the minimal screen interface and shared clean-state test interface.
- Exercise-delete physical-device tracer - pass; 1 passed, 0 failed in 41.707 seconds on iPhone 12 / iOS 26.5.
- Complete clean-state physical-device suite - pass; XCResult reports 6 passed, 0 failed, 0 skipped in 252.485 seconds.
- `./scripts/module ci ios-xq-fitness-app` - pass; unsigned generic iOS build and all 17 host tests passed. No E2E test runs in CI.
- RED filtered retention tracer - failed as intended because actual retained IDs were A/B/C while the contract required B/C.
- GREEN filtered retention tracer - pass after bounding retention at the store command seam.
- `./scripts/module ci ios-xq-fitness-app` - pass; XcodeGen generation, unsigned `generic/platform=iOS` build, and 17 `FitnessCore` unit tests passed. No E2E test runs in CI.
- Generic `build-for-testing` for `ios-xq-fitness-app-ui-tests` - pass; all app and XCUITest sources compile without a simulator.
- Three-snapshot retention tracer - pass on iPhone 12 / iOS 26.5 in 118.001 seconds; it covers seven day rows, exercise add/edit, First/Increased/Decreased indicators, and relaunch persistence.
- Complete physical-device suite - pass; XCResult reports 5 passed, 0 failed, 0 skipped in 209.645 seconds.
- `swift package dump-package --package-path modules/ios-xq-fitness-app/FitnessCore` - pass.
- `./scripts/module info ios-xq-fitness-app` and `node scripts/harness-context.mjs module ios-xq-fitness-app` - pass.
- `./init.sh` - pass after native module registration and version validation.
- Scoped URL/network scan - pass; no HTTP URL, `URLSession`, WebSocket, or Network framework use exists in the native module.
- Parallel standards/spec review - complete; persistence, schema-safety, optional-notes, production-namespace coverage, CI pinning, documentation, and lifecycle findings were resolved.
- `./scripts/module ci xq-fitness-mobile` - pass; clean npm install, successful Expo iOS Hermes export, 10 unit suites and 75 tests passed.
- `npm run test:integration:local` - pass; 10 integration suites and 61 tests passed, report generated, logs collected, and all containers/network removed.
- `bash -n modules/xq-fitness-mobile/device.sh modules/xq-fitness-mobile/build-device.sh modules/xq-fitness-mobile/scripts/run-integration-tests.sh` - pass.
- `node scripts/harness-context.mjs module xq-fitness-mobile` - pass.
- `./init.sh` - pass after registration and version synchronization.
- Final standards/spec re-review - pass; all findings resolved.
- Native physical-device acceptance - pass; the signed app and consumer XCUITest runner installed and all seven current journeys completed on the dedicated iPhone. Expo reference-app device acceptance remains blocked as recorded in `feat-010`.
- Dependency audit observation - npm reports 42 inherited vulnerabilities (1 low, 17 moderate, 24 high) in the Expo 49 dependency tree; not changed automatically because fixes may be breaking.

### PR Ready

- Status: yes
- Reason: the native-only scope was documented, compiled, host-tested, independently reviewed, verified through the complete isolated physical-device suite, repaired against the hosted CI environment, and merged with all gates green.
- Merged PR: https://github.com/chauhaidang/xq-harness/pull/24 at squash commit `1468e25579fc608e715142cec2fead885f0f0ca6`.

### CI Ready

- Status: yes
- Reason: the exact registered build-and-unit-only command passed locally and on GitHub's pinned `macos-15`/Xcode 16.4 environment; device E2E remains intentionally local-only.

## Status

### What's Done

- [x] Replaced broad startup guidance in `AGENTS.md` with a query-first harness flow
- [x] Added `scripts/harness-context.mjs` as the bounded context entrypoint
- [x] Added `.repo-harness/context-index.json` and topic files for on-demand detail
- [x] Added `feature_list.json`, `progress.md`, `session-handoff.md`, and `init.sh`
- [x] Used a real maintenance task to validate and tighten repo package-manager assumptions
- [x] Added explicit before/after, regression, PR-ready, and CI-ready checkpoints to the harness workflow
- [x] Copied the isolated-modules migration handoff into the project root for durable resume
- [x] Removed the root Node workspace model and moved the Node modules to module-local lockfiles plus `npm ci`
- [x] Added and visually verified the read-only GitHub workflow observability dashboard
- [x] Redesigned the dashboard as a Fleet Grid heatmap and merged PR #21 into `main`
- [x] Moved semantic versions and changelogs into each module's `version.yaml` and generated declared native mirrors
- [x] Fixed dashboard duplicate-run reconciliation so completed successful runs remain green
- [x] Registered and documented `xq-fitness-mobile` with canonical versioning and build-and-unit-only CI
- [x] Added and verified local integration orchestration with complete cleanup
- [x] Added environment-driven physical-device doctor/build/install/launch commands and removed simulator workflows
- [x] Added the native offline `ios-xq-fitness-app` foundation with MVVM plus Router
- [x] Added versioned primary/recovery JSON persistence and 11 host-side unit tests
- [x] Added generic-device build plus unit-test-only native CI with Xcode 16.2 pinned
- [x] Added and passed four consumer-owned XCUITest journeys on the dedicated iPhone
- [x] Added schema-v2 seven-day routines, local exercise CRUD, and immutable snapshot comparison
- [x] Added and passed a fifth device journey for drill-down and previous-snapshot indicators
- [x] Bounded snapshot retention to the newest two captures and proved C-versus-B comparison after relaunch
- [x] Added the component × capability coverage matrix with unit/UI ownership and named gaps
- [x] Closed the exercise-delete UI gap and enforced verified clean state before every device test
- [x] Added and physically verified persistent labels for every exercise input

### What's In Progress

- [ ] Select the next native slice: routine lifecycle controls, custom day labels, or richer snapshot history

### What's Next

1. Decide whether the next priority is routine rename/delete, custom day labels, or browsing older snapshot comparisons.
2. Extend schema versioning and `FitnessStore` commands for the selected slice.
3. Extend local physical-device E2E alongside each future user-visible slice; keep CI build-and-unit-only.

## Blockers / Risks

- [ ] Free Apple development profiles limit concurrently installed development apps; a stale finance UI-test runner was removed from the device while preserving the finance app and its data.
- [ ] Expo 49 dependencies currently report 42 npm audit findings; upgrading Expo/React Native is intentionally a separate compatibility task.
- [ ] Topic staleness: `.repo-harness/context-index.json` and topic Markdown can drift from repo reality if not updated after process changes
- [ ] Coverage gaps: a future task may need a missing topic, especially for new modules or release workflows
- [ ] Local checkout is behind remote `main` after PR #21 because unrelated unstaged files must be preserved before synchronizing
- [ ] Historical docs remain intentionally stale in `docs/MIGRATION_XQ_TOOLBOX.md` and decision history; they still describe older workspace models
- [ ] `xq-test-utils` test run still reports a Jest force-exit warning, and `xq-test-infra` tests emit `MaxListenersExceededWarning`; neither blocked CI, but both remain worth tracking separately
- [ ] `cd-xq-scripts.yml` still triggers from `modules/xq-scripts/VERSION` changes, not `modules.yaml`, so future xq-scripts releases must update the registry and mirror file in the same change

## Decisions Made

- **Use a bounded index plus on-demand topic files**
  - Context: the repo needs low startup context cost and targeted retrieval
  - Alternatives considered: broad startup docs; append-only memory/event stores

- **Keep the query layer file-based and local**
  - Context: the harness should be simple enough that agents actually use it
  - Alternatives considered: database-backed state; heavy auto-extraction

- **Make verification monorepo-specific**
  - Context: generic package-manager startup is a poor fit for `xq-harness`
  - Alternatives considered: root `pnpm install`; per-module autodetection without the module runner

- **Switch the Node workspace default from pnpm to npm**
  - Context: the repo should advertise and execute npm as the default Node package manager
  - Alternatives considered: keeping pnpm as-is; swapping only `packageManager` metadata without changing workspace/module commands

- **Finish the Node migration as module-local npm with lockfiles**
  - Context: removing the root `package.json` required each Node module to become self-contained at install, TypeScript config, and workflow levels
  - Alternatives considered: keeping a minimal root package file; mixed npm/pnpm module policy; leaving shared `modules/tsconfig.base.json`

- **Make each module's `version.yaml` its enforced release authority**
  - Context: version history and release notes belong with the independently built and released module
  - Alternatives considered: one root release manifest; storing current versions in `modules.yaml`

- **Prefer newer completed run records when GitHub API sources disagree**
  - Context: repository-wide and workflow-specific endpoints can briefly return different statuses for the same run ID
  - Alternatives considered: treating all warnings as failures; keeping first-seen duplicate records

## Files Modified This Session

- `AGENTS.md` - rewrote startup flow around query-first harness usage
- `feature_list.json` - added feature tracker and evidence
- `progress.md` - recorded current harness state
- `session-handoff.md` - added resume summary for next session
- `isolated-modules-migration-handoff.md` - durable in-repo resume plan for the monorepo-to-isolated-modules migration
- `init.sh` - added startup verification for the monorepo harness
- `scripts/harness-context.mjs` - added context query CLI
- `.repo-harness/context-index.json` - added bounded index
- `.repo-harness/topics/*.md` - added on-demand context topics
- `package.json` - removed the obsolete root Node workspace file
- `modules.yaml` - switched Node module installs to `npm ci --include=dev`, removed `workspace` metadata, and kept module-local commands only
- `modules/*/version.yaml` - added canonical versions, changelogs, and mirror declarations per module
- `modules.yaml` - removed release state so it remains an execution registry
- `scripts/validate-module-versions.py` - added shared version-policy validation across native file formats
- `scripts/check-registry-version-changes.py` - added module-local version change detection for workflows
- `scripts/check-xq-version-changes.js` - redirected the legacy checker to module-local version detection
- `scripts/module` - added per-module version validation before install/build/test commands
- `init.sh` - added a repo-wide version-policy check
- `.github/workflows/*.yml` - switched version checks to the registry policy and aligned CI trigger paths with the new validator scripts
- `docs/modules/README.md`, `docs/modules/onboarding.md`, `docs/github-actions.md`, and `docs/product/xq-toolbox-overview.md` - documented `modules.yaml` as the canonical semver source with declared mirror files
- `modules/xq-*/package.json` - aligned packageManager metadata with npm and removed direct pnpm script usage where needed
- `modules/xq-*/package-lock.json` - added clean module-local npm lockfiles for Node modules
- `modules/xq-common-kit/tsconfig.json` and `modules/xq-test-utils/tsconfig.json` - inlined TypeScript compiler settings so the modules no longer depend on `modules/tsconfig.base.json`
- `modules/tsconfig.base.json` - removed obsolete shared TypeScript base config
- `.github/workflows/*.yml` - removed root pnpm trigger assumptions and aligned `xq-octopus` release to npm
- `README.md`, `CATALOGUE.md`, `docs/github-actions.md`, `docs/modules/*.md`, `modules/xq-octopus/*`, and skill docs - rewrote active guidance to the isolated npm model
- `AGENTS.md` - added explicit change-state checkpoints and end-of-session expectations
- `.repo-harness/topics/agent-workflow.md` - added required checkpoint details for change sessions
- `modules/xq-kraken/model/api_catalog.py` - replaced mutable, merged payload types with immutable request/response domain models and kept `operation_id` required
- `modules/xq-kraken/API_CATALOG_CONTRACT.md` - aligned the written contract with the required `operation_id` invariant
- `modules/xq-workflow-dashboard` - added the isolated collector, schema, static UI, tests, local docs, and lockfile
- `modules/xq-workflow-dashboard/src/github-client.mjs` and `test/dashboard-data.test.mjs` - reconciled duplicate run status and added regression coverage
- `modules/xq-workflow-dashboard/design-qa.md` - recorded selected-reference comparison history and passing visual QA evidence
- `.github/workflows/ci-xq-workflow-dashboard.yml` - added scoped module CI; the planned Pages deployment workflow was removed for local-only operation
- `modules.yaml` - registered the isolated dashboard module
- `.repo-harness/context-index.json` - made the dashboard discoverable through bounded module queries

## Evidence of Completion

- [x] Tests pass: `./init.sh`
- [x] Harness summary works: `node scripts/harness-context.mjs summary`
- [x] Harness structure validates: `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target /Users/automation2/Documents/workspace/xq-harness`
- [x] Module registry reflects isolated module metadata: `./scripts/module info xq-common-kit`
- [x] Workflow checkpoint docs present in harness files: `AGENTS.md`, `.repo-harness/topics/agent-workflow.md`, `progress.md`, `session-handoff.md`
- [x] Root workspace references removed from active docs/workflows: `rg -n 'pnpm|workspace:\*|pnpm-workspace.yaml|pnpm-lock.yaml|tsconfig\.base\.json' ...`
- [x] Representative repo-level module CI passed sequentially:
  - `./scripts/module ci xq-common-kit`
  - `./scripts/module ci xq-test-utils`
  - `./scripts/module ci xq-test-infra`
  - `./scripts/module ci xq-skills`
  - `./scripts/module ci xq-octopus`
- [x] Dashboard module CI, schema validation, live API collection, browser filtering, responsive smoke test, and npm audit passed
- [x] Release manifest validation, synchronization, and version detection passed:
  - `python3 scripts/validate-module-versions.py`
  - `python3 scripts/check-registry-version-changes.py --module xq-scripts`
  - `./init.sh`
  - `./scripts/module ci xq-common-kit`

## Notes for Next Session

This harness is intentionally small. Start with `summary`, then load one topic
or module at a time. The isolated-module migration has now been implemented:
there is no root Node workspace file, Node modules own their own lockfiles, and
active docs/workflows reflect `npm ci --include=dev` per module. The remaining
follow-up is observational rather than structural. Separately, `xq-kraken` now
has an explicit API catalog contract that treats `operation_id` as required and
uses immutable tuple-backed domain models.
The workflow dashboard is local-only. Run `npm run dashboard` from its module
directory after confirming `gh auth status`, then open `http://127.0.0.1:4173`.
The active semver policy is module-local: update `modules/<module>/version.yaml`,
prepend its changelog entry, run `./scripts/module sync-version <module>`, and
rely on `./init.sh` or `./scripts/module ...` to catch drift.

## 2026-07-15 Weekday Badge Follow-up

- Before state: the weekday names were present in the data model, but the routine workspace still displayed numeric `1`–`7` badges.
- After state: the routine workspace displays three-letter weekday badges (`MON` through `SUN`) alongside the full weekday names.
- Regression results: direct native Xcode build passed; `./scripts/module test ios-xq-fitness-app` passed all 17 tests.
- PR ready: yes for this scoped UI change; unrelated dirty files were preserved.
- CI ready: yes for the verified native build and host tests.

## 2026-07-15 Signing Script Follow-up

- Before state: the IPA helper accepted an optional team and required care to avoid stale environment overrides.
- After state: the helper defaults to working project team `T99X93V7Y2`, accepts `DEVELOPMENT_TEAM` overrides, passes the team explicitly to archive/export, and never runs `xcodegen`.
- Regression results: script syntax/help and `git diff --check` passed; archive/export and provisioning validation passed with the default team. CoreDevice installation stalled and was stopped after the IPA was produced.
- PR ready: scoped changes are reviewable, but unrelated dirty worktree files must remain excluded from the PR.
- CI ready: native build/test verification remains valid; signed deployment is local-only.
