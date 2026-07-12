# Session Progress Log

## Current State

**Last Updated:** 2026-07-12 22:17 +07
**Session ID:** current-thread  
**Active Feature:** feat-008 - Module-local version manifests

## Change Checkpoints

### Before State

- The repo documentation already claimed `modules.yaml` was the single version authority, but modules still carried independent semantic-version definitions in `package.json`, `pyproject.toml`, Xcode files, and plain `VERSION` files without one enforced rule.
- Release automation for publishable Node modules still keyed version-change detection off `package.json`, while the tarball flow keyed off `VERSION`, so the registry and release callers were not aligned.
- `xq-scripts` still had placeholder registry version `0.0.0` in `modules.yaml` even though its real released version was `1.0.2` in `modules/xq-scripts/VERSION`.
- Onboarding docs did not require a module to declare which native files were allowed to mirror the registry version.

### After State

- Every registered module now owns a `version.yaml` containing its current semantic version, newest-first changelog, and native mirror declarations.
- `modules.yaml` is limited to module execution metadata rather than duplicating release state.
- `scripts/validate-module-versions.py` validates the release schema and native mirrors, while `./scripts/module sync-version <module>` generates package, lockfile, Python, Xcode, and plain version mirrors.
- `./scripts/module ...` and `./init.sh` fail fast when release definitions are missing or mirrors drift.
- CI/CD workflows read and compare only the selected module's `version.yaml`; initial adoption is a non-publishing baseline.
- Active onboarding and Actions docs describe the manifest-first release workflow.

### Regression Test Results

- `python3 scripts/validate-module-versions.py` - pass
- `python3 scripts/validate-module-versions.py --sync` - pass
- `python3 scripts/check-registry-version-changes.py --module xq-common-kit` - pass; reports `version_changed: false` for initial manifest adoption
- `./init.sh` - pass
- `./scripts/module ci xq-common-kit` - pass

### PR Ready

- Status: yes
- Reason: the version-policy diff is scoped, documented, and backed by local startup plus representative module verification.

### CI Ready

- Status: yes
- Reason: module-local manifest validation, synchronization, and version-change detection pass locally, and representative Node module CI still succeeds.

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

### What's In Progress

- [ ] No active implementation work remains; future releases add one manifest entry and run the mirror sync command

### What's Next

1. Require `version.yaml` for the next module onboarding
2. Update the module version, prepend its changelog entry, and run `./scripts/module sync-version <module>`
3. Keep the local checkout aligned with remote `main` when it is safe to handle the unrelated unstaged files

## Blockers / Risks

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
