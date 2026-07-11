# Session Handoff

## Current Objective

- Goal: keep startup context small and force explicit harness queries for repo context
- Current status: core harness framework and isolated Node migration are in place; the local live workflow observability dashboard is implemented
- Branch / commit: main / local working tree

## Change Checkpoints

- Before state: the repo still had a root Node workspace file, shared TypeScript base config for two Node modules, and active pnpm/root-workspace guidance in CI and docs
- After state: the root Node workspace file is gone, Node modules use module-local `package-lock.json` plus `npm ci --include=dev`, and active docs/workflows now describe the isolated module model
- After state: the root Node workspace file is gone, Node modules use module-local `package-lock.json` plus `npm ci --include=dev`, active docs/workflows now describe the isolated module model, and `modules/xq-kraken` now has an immutable API catalog domain model with required `operation_id`
- After state: `xq-workflow-dashboard` collects and validates live Actions telemetry through local `gh` authentication, streams near-real-time health/history updates, and has scoped CI with no deployment workflow
- Regression test results: existing evidence remains valid; dashboard module CI, zero-vulnerability npm audit, live 14-workflow collection, YAML parsing, localhost serving, interactive filtering, and mobile browser checks pass
- PR ready: yes
- CI ready: yes

## Completed This Session

- [x] Added a query-first root `AGENTS.md`
- [x] Added `scripts/harness-context.mjs`
- [x] Added bounded context files under `.repo-harness/`
- [x] Added lifecycle/state artifacts: `feature_list.json`, `progress.md`, `session-handoff.md`
- [x] Added monorepo-specific `init.sh`
- [x] Switched root/package module metadata and module-runner commands from pnpm to npm
- [x] Removed stale `pnpm-workspace.yaml` and `pnpm-lock.yaml`
- [x] Added explicit before/after, regression, PR-ready, and CI-ready harness checkpoints
- [x] Recreated the isolated-modules migration handoff inside the project root
- [x] Executed the isolated-module migration for the active Node modules
- [x] Corrected the `xq-kraken` API catalog model and contract so `operation_id` is required and request/response payloads are distinct immutable types
- [x] Built and visually verified the isolated GitHub workflow observability dashboard

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Harness startup | `./init.sh` | pass | Startup path runs and checks registry + harness summary |
| Summary query | `node scripts/harness-context.mjs summary` | pass | Confirms bounded startup context |
| Module registry | `./scripts/module info xq-common-kit` | pass | Confirms no `workspace` field remains in module info output |
| Repo CI check | `./scripts/module ci xq-common-kit` | pass | Sequential rerun after lockfile + tsconfig isolation |
| Repo CI check | `./scripts/module ci xq-test-utils` | pass | Includes downstream internal package resolution through semver |
| Repo CI check | `./scripts/module ci xq-test-infra` | pass | Passes with existing listener warnings in tests |
| Repo CI check | `./scripts/module ci xq-skills` | pass | Verifies bundled skills package |
| Repo CI check | `./scripts/module ci xq-octopus` | pass | Passes when localhost bind is allowed during verification |
| Active stale-reference scan | `rg -n 'pnpm|workspace:\*|pnpm-workspace.yaml|pnpm-lock.yaml|tsconfig\.base\.json' ...` | pass | No remaining matches in active docs/workflows/config outside intentionally historical areas |
| Dashboard module CI | `./scripts/module ci xq-workflow-dashboard` | pass | Installs, builds, validates frontend syntax, and runs five behavioral tests |
| Dependency audit | `npm audit --audit-level=moderate` | pass | Zero vulnerabilities after pinning AJV 8.20.0 |
| Live collector | `npm run collect` with repository token | pass | Discovered 14 runnable workflows and emitted schema-valid telemetry |
| Browser smoke test | localhost in-app browser | pass | Live data rendered, search filter worked, and mobile viewport had no horizontal overflow |

## Files Changed

- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `scripts/harness-context.mjs`
- `.repo-harness/context-index.json`
- `.repo-harness/topics/*.md`
- `package.json`
- `modules/xq-common-kit/package-lock.json`
- `modules/xq-test-utils/package-lock.json`
- `modules/xq-test-infra/package-lock.json`
- `modules/xq-octopus/package-lock.json`
- `modules/xq-skills/package-lock.json`
- `modules.yaml`
- `scripts/module`
- `modules/xq-common-kit/package.json`
- `modules/xq-common-kit/tsconfig.json`
- `modules/xq-test-utils/package.json`
- `modules/xq-test-utils/tsconfig.json`
- `modules/xq-test-infra/package.json`
- `modules/xq-octopus/package.json`
- `modules/xq-skills/package.json`
- `modules/tsconfig.base.json`
- `isolated-modules-migration-handoff.md`
- `modules/xq-kraken/model/api_catalog.py`
- `modules/xq-kraken/API_CATALOG_CONTRACT.md`
- `modules/xq-workflow-dashboard/*`
- `.github/workflows/ci-xq-workflow-dashboard.yml`
- `.repo-harness/context-index.json`
- `.github/CODEOWNERS`
- `docs/github-actions.md`

## Decisions Made

- Use a small JSON index for always-on metadata
- Store detailed context in topic files loaded only by explicit query
- Keep verification monorepo-aware and lightweight
- Make npm, not pnpm, the repo-default Node package manager in root metadata and module commands
- Remove the root Node workspace completely rather than keeping a stub package file
- Make the Node modules self-contained at the TypeScript-config level and lockfile level
- Add named change checkpoints so agents must report before state, after state, regression results, PR readiness, and CI readiness
- Keep `operation_id` as a required domain invariant in `xq-kraken` because downstream callers will query endpoints by that key
- Keep the dashboard local and read-only; delegate authentication to `gh`, poll server-side, and never expose credentials to browser code or committed files

## Blockers / Risks

- Topic metadata can drift if process docs change and the harness is not updated
- Real usage may reveal missing topics or overly broad summaries
- Historical docs under `docs/MIGRATION_XQ_TOOLBOX.md` and decision history still describe older workspace models by design
- `xq-test-utils` still force-exits Jest after passing tests, and `xq-test-infra` still emits `MaxListenersExceededWarning`; these are pre-existing quality issues, not migration failures
- The dashboard requires a locally authenticated GitHub CLI and only runs while `npm run dashboard` is active

## Next Session Startup

1. Read `AGENTS.md`
2. Run `./init.sh`
3. Run `node scripts/harness-context.mjs summary`
4. Read `feature_list.json` and `progress.md`
5. Query exactly one topic or module before opening broader docs

## Recommended Next Step

- Use the repo normally under the new isolated-module model, then tighten harness summaries if future agents still over-read or miss the new Node contract
- Build the `xq-kraken` extractor against the corrected API catalog contract and make missing `operationId` an explicit extraction error
- Run the dashboard locally with `npm run dashboard` when live workflow monitoring is needed
