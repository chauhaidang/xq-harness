# Session Progress Log

## Current State

**Last Updated:** 2026-07-16
**Session ID:** current-thread  
**Active Feature:** feat-022 - Agent-native iOS UI test CLI

## 2026-07-18 Matt Pocock Skills Consolidation

### Before State

- The project-local `harness-creator` skill remained installed even though its
  generated index, init script, and feature-list workflow had been retired.
- The Matt Pocock engineering suite and its GitHub, triage-label, and
  multi-context domain-doc configuration were already present.

### After State

- Removed all 25 project-local files under `.agents/skills/harness-creator/`.
- Added concise `AGENTS.md` routing through `/ask-matt`; the existing
  `/setup-matt-pocock-skills` configuration remains the repository precondition.
- Removed stale `.codex/agents/` routing because that directory is absent in the
  synced workspace; preserved the Matt Pocock skills and all unrelated module
  worktree changes.

### Regression Test Results

- Harness-creator absence and Matt Pocock skill-presence checks — pass.
- `./scripts/module list` — pass.
- `python3 scripts/validate-module-versions.py` — pass.
- `git diff --check` — pass.

### PR Ready

- Status: yes for the tracked routing update; the skill directory is ignored by
  Git, so its removal is local workspace state rather than a commit diff.

### CI Ready

- Status: yes for this documentation/skill change. No product module behavior
  changed. A fresh workspace must install the desired Matt Pocock skills
  separately because `.agents/` is ignored by Git.

## 2026-07-18 Feature List Removal

### Before State

- `feature_list.json` duplicated current scope and evidence already maintained
  in `progress.md` and `session-handoff.md`.
- `AGENTS.md` required the JSON file during startup, scope selection, session
  updates, completion evidence, verification, and escalation.

### After State

- Removed tracked `feature_list.json`.
- `progress.md` is the source of current status and verification evidence;
  `session-handoff.md` remains the fast resume artifact.
- Updated all live workflow instructions so no active process requires the
  deleted JSON file.

### Regression Test Results

- Absence check for `feature_list.json` — pass.
- `./scripts/module list` — pass.
- `python3 scripts/validate-module-versions.py` — pass.
- `git diff --check` — pass.

### PR Ready

- Status: yes for the scoped harness simplification; unrelated dirty module
  work must remain excluded.

### CI Ready

- Status: yes for the documentation/state change. Module-specific CI remains
  owned by the current iOS UI test CLI workstream.

## 2026-07-18 Obsolete Indexed Startup Harness Removal

### Before State

- `.repo-harness/context-index.json` was already absent, leaving the indexed
  context query and `init.sh` startup path unusable.
- `AGENTS.md` still required both artifacts before any task and treated the
  init script as the repository-wide completion gate.

### After State

- Removed tracked `init.sh`; the already-absent context index remains removed.
- Replaced live indexed-startup instructions with targeted `rg` discovery and
  explicit module, version-policy, JSON, and diff verification commands.
- Historical records of checks that genuinely ran in older sessions remain
  unchanged.

### Regression Test Results

- `./scripts/module list` — pass.
- `python3 scripts/validate-module-versions.py` — pass.
- `git diff --check` — pass.

### PR Ready

- Status: yes for the scoped harness simplification; unrelated dirty module
  work must remain excluded.

### CI Ready

- Status: yes for the harness change. Module-specific CI remains owned by the
  active feat-022 work.

## 2026-07-18 Engineering Skills Repository Setup

### Before State

- `AGENTS.md` had no engineering-skill configuration, and `docs/agents/` did
  not exist.
- The repository had a GitHub remote and the `triage` skill installed, but no
  documented issue-tracker workflow, canonical triage-label mapping, or domain
  documentation layout.
- The now-retired indexed startup harness was incomplete before this change;
  that separate lifecycle issue was resolved by the subsequent simplification.

### After State

- `AGENTS.md` points engineering skills to the repository's GitHub Issues, the
  five default triage labels, and a multi-context domain documentation layout.
- Added `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and
  `docs/agents/domain.md` with the approved consumer rules.
- The unrelated active feat-022 implementation and existing module changes
  remain untouched.

### Regression Test Results

- Focused configuration content checks — pass.
- `git diff --check` — pass.
- Direct JSON and diff validation — pass; the new documentation introduced no
  executable behavior.

### PR Ready

- Status: yes for the scoped engineering-skills setup; unrelated dirty module
  work must remain excluded.

### CI Ready

- Status: yes for the documentation-only setup under the direct verification
  workflow introduced by the subsequent harness simplification.

## 2026-07-18 xq-kraken Dynamic Client Workshop Completion

### Before State

- Checkpoints 0–2 passed; `describe()` did not consistently enforce the
  allowlist and `invoke()` was absent.
- The workshop's functional checkpoints for validation, invocation, and result
  handling could not complete.

### After State

- `KrakenDynamicClient` now merges parameters by OpenAPI identity with
  operation-level precedence, enforces one visibility guard, validates inputs
  before transport through aiopenapi3-generated Pydantic types, invokes the
  selected operation, and normalizes results/errors into Kraken DTOs.
- Focused regression tests cover precedence, visibility, validation before
  transport, and transport-error mapping. The workshop text now matches the
  completed dynamic-client behavior.

### Regression Test Results

- `env UV_CACHE_DIR=/private/tmp/xq-kraken-uv-cache uv run python -m unittest tests.test_dynamic_client -v`
  from `modules/xq-kraken` — pass; 13 tests.
- `env UV_CACHE_DIR=/private/tmp/xq-kraken-uv-cache uv run behave workshop/features/checkpoints.feature`
  from `modules/xq-kraken` — pass; 8 scenarios / 8 steps.

### PR Ready

- Status: yes for the xq-kraken workshop completion; unrelated active feat-022
  work remains outside scope.

### CI Ready

- Status: yes for the verified xq-kraken workshop behavior.

## 2026-07-17 xq-kraken aiopenapi3 Cheat Sheet

### Before State

- The dynamic-client workshop explained the OpenAPI-backed flow, but learners
  lacked a compact reference distinguishing the raw YAML mapping from
  aiopenapi3's typed runtime object.

### After State

- Added `modules/xq-kraken/aiopenapi3-cheat-sheet.md` and linked it from the
  module README. It documents the raw mapping fields used for catalog/schema
  output, the private typed root, operation lookup, loaders, and `$ref` rules.

### Regression Test Results

- `uv run python -m unittest discover -s tests -p 'test_workshop_assets.py' -v`
  from `modules/xq-kraken` — pass; 3 tests.
- `git diff --check` — pass before the focused test command.

### PR Ready

- Status: yes for the narrow documentation addition; unrelated xq-kraken and
  active feat-022 changes remain outside its scope.

### CI Ready

- Status: yes for the documentation addition; no runtime behavior changed.

## 2026-07-16 Project-Scoped Codex Agent Team

### Before State

- The repository had shared `AGENTS.md` and reusable skills, but no
  project-scoped custom agent definitions or team orchestration guide.
- The active feat-022 work and unrelated Kraken changes were already dirty and
  had to remain untouched.

### After State

- Added `product_owner`, `solution_designer`, `ui_designer`, `backend_dev`,
  `frontend_dev`, `sdet`, and `devops` custom agents under `.codex/agents/`.
- Added role boundaries, multiple-instance nicknames, independent/group
  patterns, root-owned coordination, disjoint edit ownership, and one-level
  nesting in `.codex/TEAM.md` and `.codex/config.toml`.
- Kept feat-022 as the active feature and recorded the isolated team setup as
  completed feat-023.

### Regression Test Results

- `yq -p=toml` parsed `.codex/config.toml` and all seven custom agent files.
- `python3 -m json.tool feature_list.json` - pass.
- `codex --strict-config doctor --summary --no-color --ascii` - project config
  loaded; unrelated local state-database and network health failures remain.
- `git diff --check` - pass.
- `./init.sh` - pass.

### PR Ready

- Status: yes for feat-023; the new team files and narrow harness guidance are
  reviewable, while unrelated pre-existing changes remain outside this feature.

### CI Ready

- Status: yes; repository startup and syntax validation pass, and no product
  module behavior changed.

## 2026-07-16 Simulator Acceptance and XCTestrun Fix

### Before State

- The final simulator acceptance failed because the protected per-session
  `.xctestrun` was copied into the session evidence directory while its
  `__TESTROOT__` paths remained relative to the cached build-products directory.
- The host volume also had less than 150 MiB free, which prevented Xcode runner
  installation and ordinary Swift index generation.

### After State

- Added a regression-covered xctestrun location rule: the protected session
  file remains beside the generated build product and is removed on every
  daemon exit path.
- Cleaned only disposable module compiler artifacts, failed session evidence,
  and generic-runner caches; source and tested-app data were preserved.
- The installed Settings app completed the simulator agent loop on iPhone 16
  `61112FCA-8781-4A4C-AB6C-42007DDF483B`: session start, 26-element map, exact
  search-field find, tap, clear, type, value-contains assertion, screenshot,
  and session stop all passed. Stopping left Settings running.
- Evidence is retained in session `c3d61550-29c3-4899-a47e-f799936ed622`, with
  XCResult, Xcode log, redacted command transcript, and screenshot artifacts.

### Regression Test Results

- Focused TDD tracer — RED because `SessionXCTestrunLocation` did not exist,
  then GREEN after the build-relative path implementation.
- `swift test --disable-index-store` — pass; 24 tests, 0 failures.
- `./scripts/module ci xq-ios-ui-test-framework` — attempted but blocked during
  Swift index generation by `ENOSPC`; the equivalent complete test suite passed
  with index storage disabled after cache cleanup.
- Live simulator acceptance — pass for start/map/find/tap/clear/type/assert/
  screenshot/stop against already-installed `com.apple.Preferences`.

### PR Ready

- Status: no. The simulator path is now acceptance-proven, but the equivalent
  JSON scenario and physical-device journey remain final feature gates.

### CI Ready

- Status: yes for code and tests: all 24 Swift tests pass. The standard module
  wrapper remains locally blocked only by host disk pressure while generating
  nonessential index data.

## 2026-07-16 Physical-Device Acceptance Retry

### Before State

- Physical installed-app acceptance was outstanding after the previous host
  volume reached 100% capacity.
- Two iPhones and two valid Apple Development identities were locally visible;
  the handoff incorrectly treated `Y57FXM29C3` from the certificate label as
  the development team.

### After State

- Retried `session start` against the already-installed Settings app on device
  `00008150-0012058A14F8401C`; no tested-app install, uninstall, or UI command
  occurred because generic-runner provisioning failed first.
- Certificate inspection established the actual organizational-unit team as
  `T99X93V7Y2`. A second retry used that explicit team and failed consistently:
  Xcode reports a missing `Xcode-Token`, no configured account, and no cached
  profile for `com.chauhaidang.xq-ui-test-host.xctrunner`.
- Both failed daemons cleaned up successfully; `session status --json` reports
  `stopped`.

### Regression Test Results

- `./init.sh` — pass before the retry.
- `devices --kind physical --json` — pass; two connected physical iPhones.
- Signing identity check — two valid identities; certificate OU/team is
  `T99X93V7Y2`.
- Physical generic-host `build-for-testing` — blocked with Xcode exit 65 before
  test execution because account credentials/profile creation are unavailable.

### PR Ready

- Status: no. Physical acceptance still requires signing back into the Apple
  account in Xcode so managed provisioning can create the generic-runner profile.

### CI Ready

- Status: yes; this retry changed only harness evidence and exposed an external
  signing-account blocker rather than a compile or protocol regression.

## 2026-07-15 Agent-Native iOS UI Test CLI Session

### Before State

- `xq-ui-test` exposes only `preflight`, physical `devices`, and the legacy
  signed-IPA `run` command.
- The module has no persistent automation session, simulator destination,
  element map/reference protocol, JSON scenario runner, generic XCUITest host,
  or packaged agent skill.
- Existing xq-kraken worktree changes are unrelated and must remain untouched.

### Intended After State

- Keep the legacy commands compatible while adding terminal-only interactive
  XCUITest sessions for installed apps on simulators and physical iPhones.
- Add versioned JSON envelopes, refs/selectors, core actions/assertions,
  fail-fast scenarios, evidence capture, and a bundled installable agent skill.
- Add focused tests, architectural/product documentation, and harness evidence;
  record any simulator or device acceptance that cannot run locally.

### After State

- Preserved legacy `preflight`, physical-only `devices`, and signed-IPA `run`;
  added explicit simulator/physical/all discovery and the full installed-app
  session command surface.
- Added a mode-0600 daemon protocol with one-user session state, idle expiry,
  typed selectors/references, public-attribute element maps, stale/ambiguity
  errors, actions, waits/assertions, screenshots, transcripts, and XCResult.
- Added the targetless generic XCTest host. Its cache key includes CLI protocol,
  Xcode, SDK, destination kind, and team; it uses `build-for-testing`, creates a
  protected per-session `.xctestrun`, then runs `test-without-building`.
- Added schema-v1 fail-fast JSON scenarios with named environment resolution,
  redaction, failure screenshots, completed step results, cleanup, and a JSON
  scenario report.
- Added and validated the bundled `xq-ui-test` Codex skill plus project/user
  installation, ADR 0013, product/architecture docs, and the feature story.
- The live simulator journey proved session start/status, map, exact find, tap,
  type, and assertion against the already-installed Settings app without an app
  install/uninstall. The later final xctestrun acceptance build was prevented
  from writing its xctestrun because the host disk reached 100% capacity.

### Regression Test Results

- `./scripts/module ci xq-ios-ui-test-framework` — pass; build plus 23 Swift
  tests, 0 failures.
- Generic host `xcodebuild ... build-for-testing` — pass (`TEST BUILD SUCCEEDED`)
  after the final host source changes.
- `quick_validate.py` for bundled `xq-ui-test` skill — pass.
- Fresh-agent skill forward test — completed; exact matching, clear-before-type,
  cleanup ownership, and aggregate-scenario guidance were incorporated.
- Two-axis review — findings addressed for step results/reports, graceful
  XCResult finalization, ambiguity candidates, cache/xctestrun architecture,
  launch-environment redaction, and documented process ownership.
- `git diff --check` for the scoped feature — pass.
- Final `./init.sh` — pass.
- Final simulator xctestrun journey — blocked by `ENOSPC` while Xcode wrote the
  generated `.xctestrun`; earlier direct-host live command journey passed.
- Physical installed-app acceptance — not run; requires freeing disk before
  signing the generic runner with local team `Y57FXM29C3` and using an unlocked
  connected iPhone.

### PR Ready

- Status: no. The diff is scoped and reviewed, but the final simulator scenario
  and physical-device acceptance evidence remain outstanding because the local
  volume has insufficient free space.

### CI Ready

- Status: yes. Required module CI and the independently built generic host pass;
  device acceptance is a release/evidence blocker rather than a compile/test
  blocker.

## 2026-07-15 InvocationRequest Contract Fix

### Before State

- Checkpoint 0 constructed `InvocationRequest` with only an operation ID, as
  documented by the workshop contract.
- The staged learner DTO required `parameters` and `request_body`, so the
  checkpoint errored before invoking the fake client.

### After State

- `InvocationRequest.parameters` is a read-only mapping with an empty default.
- The optional payload field is consistently named `body` and defaults to
  `None`, matching later checkpoints and the dynamic-client guide.
- The public DTOs in `kraken/models.py` are frozen, and result headers expose a
  read-only mapping type.

## 2026-07-15 Guided xq-kraken Checkpoint 1

### Before State

- Checkpoint 0 defined the stable client seam, but no dynamic OpenAPI adapter
  existed; checkpoint 1 failed with `ModuleNotFoundError`.

### After State

- Added `kraken.dynamic_client.KrakenDynamicClient.from_file`.
- It loads the owned YAML document, requires unique non-empty `operationId`
  values for every HTTP operation, builds a private synchronous aiopenapi3
  parser with the supplied base URL, and exposes deterministic allowlisted
  summaries through `search`.
- Parser-specific mutable JSON typing is confined to the adapter seam.

### Regression Test Results

- Checkpoint 0 Behave scenario - pass.
- Checkpoint 1 Behave scenarios - pass; 3 scenarios.
- BasedPyright - pass; 0 errors, warnings, or notes.
- `git diff --check` - pass.

### Next Checkpoint

- Implement checkpoint 2: transform the indexed raw operation into an
  `OperationDescription`, including inherited parameters, request bodies, and
  responses.

## 2026-07-16 xq-kraken Workshop Documentation Consolidation

- Replaced temporary `feedback.md` and the obsolete
  `DYNAMIC_CLIENT_GUIDE.md` with `modules/xq-kraken/workshop.md`.
- The new guide teaches the KISS concrete-facade design: one client, one DTO
  vocabulary, private aiopenapi3 usage, allowlist policy, and Behave checks.
- README and the workshop asset guard now point to the consolidated guide.
- `python -m unittest discover -s tests -p 'test_*.py' -v` passed 6 tests;
  `git diff --check` and `./init.sh` passed.

### Regression Test Results

- `.venv/bin/behave workshop/features/checkpoints.feature --tags=checkpoint0`
  - pass; 1 scenario and 1 step.
- `.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v` - pass;
  3 structural tests.
- `.venv/bin/python -m py_compile kraken/models.py workshop/checkpoint_0.py` -
  pass.
- `git diff --check -- kraken/models.py` - pass.

### PR Ready

- Status: yes for this focused contract correction.

### CI Ready

- Status: no for the full learner implementation; later checkpoints and
  BasedPyright remain outside this focused checkpoint-0 fix.

## 2026-07-15 Behave Functional Test Session

### Before State

- Pytest executed functional adapter checks and opt-in workshop checkpoints.
- Functional behavior lived primarily in Python test functions rather than
  caller-readable Gherkin scenarios.

### After State

- `features/xq_kraken.feature` is the default functional suite: JSON/YAML file
  loading, pinned dynamic invocation, and pre-transport validation.
- `workshop/features/checkpoints.feature` exposes checkpoints 0-5 as eight
  tagged scenarios; unfinished exercises remain outside the default suite.
- Behave 1.3.3 replaces pytest in `pyproject.toml` and `uv.lock`; unittest is
  retained only for three structural workshop/package checks.

### Regression Test Results

- `.venv/bin/behave features` - pass; 1 feature, 4 scenarios, 14 steps.
- `.venv/bin/behave --dry-run workshop/features/checkpoints.feature` - pass;
  8 scenarios and 8 steps resolve without ambiguity.
- `.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v` - pass;
  3 structural tests.
- `uv build` - pass.
- `.venv/bin/basedpyright` - blocked by separately staged incomplete learner
  file `kraken/client.py` (`class KrakenClient(Protocol):` has no body).

### PR Ready

- Status: yes for the Behave migration; the changes are scoped and verified.

### CI Ready

- Status: no until the independently staged `kraken/client.py` is completed or
  removed; the Behave and unittest gates themselves are green.

## 2026-07-15 Contract-First Workshop Session

### Before State

- Checkpoint 1 introduced the concrete `KrakenDynamicClient` before the full
  caller-facing DTO, error, and interface vocabulary existed.
- Later checkpoints added contract types only when the adapter needed them,
  making the library implementation drive the learning order.
- Checkpoint tests called the concrete adapter directly.

### After State

- Checkpoint 0 now defines frozen DTOs, stable exceptions, and the three-method
  `KrakenClient` Protocol before any OpenAPI or transport implementation.
- An in-memory fake demonstrates structural substitutability and lets callers
  complete search → describe → invoke using only the interface.
- Checkpoints 1-5 construct `KrakenDynamicClient` as the concrete adapter but
  exercise behavior through `KrakenClient`.
- The guide records interface invariants, error modes, Protocol-versus-ABC
  reasoning, and the rule that adapter details must not reshape the interface.

### Regression Test Results

- `.venv/bin/pytest -q` - pass; 7 normal tests.
- Explicit collection of checkpoint 0 through checkpoint 5 - pass; 8 learner
  assertions collected.
- `.venv/bin/basedpyright` - pass; 0 errors, warnings, or notes.
- `uv build` - pass; sdist and wheel build successfully.
- `./init.sh` and `git diff --check` - pass after the workshop uplift.

### PR Ready

- Status: yes.
- Reason: the change is confined to xq-kraken workshop material, its guards,
  documentation, and harness evidence, with no production behavior change.

### CI Ready

- Status: yes for this unregistered module.
- Reason: normal tests, type checking, packaging, and root startup are green;
  unfinished checkpoints remain opt-in by design.

## 2026-07-15 xq-kraken Package Refactor Session

### Before State

- Runtime modules, tests, workshop checkpoints, and the owned OpenAPI fixture
  all lived at the xq-kraken module root after the flat-layout spike.
- Production modules were imported as unrelated top-level modules such as
  `api_catalog` and `file_api_source`, and the wheel shipped those loose files.
- The root also contained an unused generated PyCharm `main.py` sample.

### After State

- Runtime code lives in the public `kraken` import package and uses package-
  relative imports; `kraken.__init__` exposes the current public contract.
- Ordinary tests and the project-owned fixture live under `tests`, while the
  intentionally opt-in learning checkpoints live under `workshop`.
- Hatch explicitly builds `kraken`; pytest and BasedPyright use the new
  boundaries, documentation commands and links match them, and the unused
  PyCharm sample was removed.

### Regression Test Results

- `.venv/bin/pytest -q` - pass; 7 normal tests.
- `.venv/bin/basedpyright` - pass; 0 errors, warnings, or notes.
- Explicit collection of `workshop/checkpoint_1.py` through
  `workshop/checkpoint_5.py` - pass; 7 learner assertions collected.
- `uv build` - pass; sdist and wheel built, and the wheel contains the
  `kraken` package rather than loose top-level modules.
- `./init.sh` and `git diff --check` - pass after the refactor.

### PR Ready

- Status: yes.
- Reason: the refactor is scoped to xq-kraken structure, imports, packaging,
  tests, workshop paths, and their documentation; all maintained references
  were audited and verification is green.

### CI Ready

- Status: yes for this unregistered module.
- Reason: locked module-local tests, type checking, and builds pass, and root
  startup remains green.

## 2026-07-15 Flat xq-kraken Layout Session

### Before State

- Maintained files were split across `src/xq_kraken/model`, `src/xq_kraken/adapters`, `tests`, `docs`, and `workshop`.
- Tests, documentation links, workshop commands, BasedPyright, pytest, and Hatch wheel configuration depended on those nested paths.
- Generated environments, caches, build output, and IDE metadata were present but are not maintained project files.

### After State

- Every maintained Python, Markdown, TOML, YAML, and lock file now lives directly under `modules/xq-kraken`.
- Imports, workshop commands, contract/handoff paths, future implementation filenames, pytest discovery, BasedPyright scope, and wheel inputs use the flat layout.
- Empty package markers were removed; `api_catalog.py` and `file_api_source.py` ship as flat wheel modules.
- A regression test prevents maintained files from returning to the legacy `src`, `tests`, `docs`, or `workshop` directories.
- `.venv`, `dist`, caches, and IDE metadata remain generated/tool-owned exceptions to the flat layout.

### Regression Test Results

- `.venv/bin/pytest -q` - pass; flat discovery runs 7 tests.
- `.venv/bin/basedpyright` - pass; 0 errors and 0 warnings.
- `uv build` - pass; sdist and wheel build, and the wheel contains the two flat production modules.
- Explicit checkpoint collection - pass; 7 learner assertions collect from root-level checkpoint files.
- `./init.sh` and `git diff --check` - pass after the path migration.

### PR Ready

- Status: yes.
- Reason: the migration is path-only except for import/type narrowing required by the new flat verification scope, and all maintained references were updated.

### CI Ready

- Status: yes for this unregistered module.
- Reason: the module-local locked tests, type check, and package build pass; repository startup remains green.

## 2026-07-15 RestApiSource Contract Test Session

### Before State

- `src/xq_kraken/model/rest.py` contains a placeholder `RestApiSource` with an
  incomplete `load` method.
- No test covered loading an OpenAPI document from a file path through the
  `ApiSource` protocol shape.
- The checkout contains unrelated existing changes; those paths are preserved.

### After State

- Added `modules/xq-kraken/tests/test_rest_source.py` (later moved into the
  conventional test boundary).
- The test writes a JSON OpenAPI document to a temporary file, passes its
  `Path` through an `ApiSource`-typed helper, and asserts the loaded mapping is
  unchanged.
- No production implementation was added; the test is intentionally a red
  contract test for the next implementation slice.

### Regression Test Results

- `./init.sh` from the monorepo root - pass.
- `node scripts/harness-context.mjs summary` - pass.
- `python -m py_compile test_rest_source.py` - pass.
- `git diff --check` - pass.
- The original nested-path source test was intentionally red before `FileApiSource.load` was implemented; the current flat test passes.
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

- Added `modules/xq-kraken/openapi-extractor-guideline.md`.
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
- `modules/xq-kraken/kraken/api_catalog.py` - replaced mutable, merged payload types with immutable request/response domain models and kept `operation_id` required
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
