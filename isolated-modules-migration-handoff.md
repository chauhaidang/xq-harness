# Handoff: Migrate xq-harness from workspace-style monorepo to isolated modules

## Purpose

Resume the migration of `xq-harness` so each module is treated as an isolated unit:

- no shared root Node workspace
- no root `package.json`
- no root lockfile assumptions for Node modules
- module-local dependency installation and release behavior
- easier module-only onboarding and subagent delegation

This handoff is intentionally compact. It references source files instead of repeating their full contents.

## Situation

The repo has already moved part of the way toward isolated execution:

- `modules.yaml` now declares Node modules with module-local `npm install`, `npm run build`, and `npm test`
- reusable Node workflows already disable `actions/setup-node` auto-cache to avoid a root lockfile requirement:
  - [module-ci-node.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/module-ci-node.yml:1)
  - [module-cd-github-packages.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/module-cd-github-packages.yml:1)
- `xq-test-harness` and `xq-test-harness-e2e-consumer` were decommissioned in commit `624e3f9`

But the repo is not yet structurally isolated for Node modules because several root-level and documentation assumptions still describe or depend on workspace-style behavior.

## User intent to preserve

The desired end state from the conversation:

- treat each module as isolated
- avoid shared dependencies across modules
- remove the need for a root `package.json`
- make it easier to work on modules independently
- make dedicated subagents per module practical
- simplify onboarding of new assets/modules

## Current blockers

### 1. Root Node workspace still exists

- [package.json](/Users/automation2/Documents/workspace/xq-harness/package.json:1) still declares:
  - repo root package metadata
  - `"workspaces"` for Node modules

This is the main artifact that conflicts with the desired end state.

### 2. Workflow triggers still assume root pnpm workspace files

Examples:

- [ci-xq-common-kit.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-common-kit.yml:1)
- [ci-xq-test-utils.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-test-utils.yml:1)
- [ci-xq-test-infra.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-test-infra.yml:1)
- [ci-xq-skills.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-skills.yml:1)

They still include `pnpm-workspace.yaml` and `pnpm-lock.yaml` in their path filters.

That does not necessarily break execution today, but it means CI change detection still models the repo as if a shared pnpm workspace exists.

### 3. Docs still describe workspace-based Node dependency rules

Primary doc with stale guidance:

- [onboarding.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/onboarding.md:1)

Notable stale assumptions there include:

- `workspace:*` sibling dependencies
- root `pnpm-lock.yaml`
- root `pnpm-workspace.yaml`
- Node toolchain phrased as `pnpm 10 through the root`

Additional repo docs with monorepo/workspace wording still relevant to update later:

- [docs/modules/README.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/README.md:1)
- [docs/github-actions.md](/Users/automation2/Documents/workspace/xq-harness/docs/github-actions.md:1)
- [README.md](/Users/automation2/Documents/workspace/xq-harness/README.md:1)
- [CATALOGUE.md](/Users/automation2/Documents/workspace/xq-harness/CATALOGUE.md:1)

Historical/ADR docs also mention old models, but those should likely remain as historical records unless intentionally superseded:

- [docs/MIGRATION_XQ_TOOLBOX.md](/Users/automation2/Documents/workspace/xq-harness/docs/MIGRATION_XQ_TOOLBOX.md:1)
- [0008-polyglot-monorepo-modules.md](/Users/automation2/Documents/workspace/xq-harness/docs/decisions/0008-polyglot-monorepo-modules.md:1)
- [0008-xq-toolbox-integration.md](/Users/automation2/Documents/workspace/xq-harness/docs/decisions/0008-xq-toolbox-integration.md:1)

### 4. Some package metadata and publishing assumptions still need audit

Examples:

- [modules/xq-test-utils/package.json](/Users/automation2/Documents/workspace/xq-harness/modules/xq-test-utils/package.json:1)
- [modules/xq-test-infra/package.json](/Users/automation2/Documents/workspace/xq-harness/modules/xq-test-infra/package.json:1)
- [modules/xq-skills/package.json](/Users/automation2/Documents/workspace/xq-harness/modules/xq-skills/package.json:1)
- [cd-xq-octopus.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/cd-xq-octopus.yml:1)

Observed points:

- internal dependencies in Node packages are already published semver, not `workspace:*`, which is good
- some metadata still looks inconsistent, for example `repository.directory` values in some Node modules do not match the actual `modules/<name>` path
- `xq-octopus` appears to still have pnpm-oriented publishing behavior and should be reviewed explicitly during the migration

## Recommended migration sequence

### Phase 1: Define the target Node module contract

Before changing files, lock the intended invariant:

- every Node module must install from its own directory
- every Node module must carry its own lockfile if reproducibility is required
- cross-module dependencies must resolve through published versions, not sibling linking
- root CI can orchestrate modules, but must not provide shared package manager state

Expected output:

- a short ADR or design note that replaces ambiguous workspace assumptions for Node modules

### Phase 2: Remove root Node workspace dependency

Target:

- delete [package.json](/Users/automation2/Documents/workspace/xq-harness/package.json:1) once nothing depends on it

Before removal, verify:

- no workflow, script, or doc still assumes root npm package-manager detection
- no local setup instructions depend on running npm from repo root
- no root-level install or release automation needs package metadata from repo root

### Phase 3: Give each Node module explicit local install state

Audit these first:

- `xq-common-kit`
- `xq-test-utils`
- `xq-test-infra`
- `xq-octopus`
- `xq-skills`

For each module confirm:

- lockfile policy
- package manager choice (`npm` vs `pnpm`)
- publish command
- local dev setup instructions
- dependency graph against other internal packages

This phase should end with a consistent rule, not a per-module accident.

### Phase 4: Update CI callers and path filters

Update workflow callers so they reflect isolated-module inputs instead of root workspace files.

Likely files:

- [ci-xq-common-kit.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-common-kit.yml:1)
- [ci-xq-test-utils.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-test-utils.yml:1)
- [ci-xq-test-infra.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-test-infra.yml:1)
- [ci-xq-skills.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/ci-xq-skills.yml:1)
- any matching CD workflows for those modules

Change intent:

- remove `pnpm-workspace.yaml` and `pnpm-lock.yaml` trigger assumptions where they are no longer real inputs
- keep `modules.yaml`, module paths, shared scripts, and reusable workflow templates in trigger paths

### Phase 5: Rewrite docs around module isolation

Priority order:

1. [docs/modules/onboarding.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/onboarding.md:1)
2. [docs/github-actions.md](/Users/automation2/Documents/workspace/xq-harness/docs/github-actions.md:1)
3. [docs/modules/README.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/README.md:1)
4. [README.md](/Users/automation2/Documents/workspace/xq-harness/README.md:1)
5. [CATALOGUE.md](/Users/automation2/Documents/workspace/xq-harness/CATALOGUE.md:1)

The rewrite should explain:

- module-local install/build/test
- how internal published dependencies are versioned
- what files a module must own locally
- how a subagent can work from a module folder without root Node context

### Phase 6: Validate representative modules

Minimum smoke set:

- `./scripts/module ci xq-common-kit`
- `./scripts/module ci xq-test-utils`
- `./scripts/module ci xq-test-infra`
- `./scripts/module ci xq-skills`
- one module with different characteristics if still relevant, likely `xq-octopus`

If the root `package.json` has been removed, validation must prove CI and local commands still work without it.

## Open questions to resolve next session

1. Should every Node module standardize on `npm`, or should some remain `pnpm` with module-local lockfiles?
2. Is the repo still expected to contain `pnpm-workspace.yaml` at all after migration?
3. Should `xq-octopus` be brought into the same isolated-module Node policy now, or parked as a special case?
4. Should the migration be documented as a new ADR that supersedes only the Node package aspect of earlier monorepo decisions?
5. Do you want to preserve a minimal non-package root `package.json` temporarily for editor/tooling compatibility, or remove it entirely in one pass?

## Concrete next-session entry point

Start by auditing the Node modules and deciding the lockfile/package-manager rule. That decision determines whether the rest of the migration is mechanical or risky.

Suggested first commands:

```bash
./scripts/module list
sed -n '1,220p' package.json
rg -n 'workspace:\*|pnpm-workspace.yaml|pnpm-lock.yaml|npm install|pnpm install' .github docs modules package.json scripts
```

Then decide whether the target is:

- pure module-local `npm`
- pure module-local `pnpm`
- mixed-by-module with explicit documentation

Only after that should the root `package.json` be removed.

## References

- Root Node workspace: [package.json](/Users/automation2/Documents/workspace/xq-harness/package.json:1)
- Module registry: [modules.yaml](/Users/automation2/Documents/workspace/xq-harness/modules.yaml:1)
- Reusable Node CI template: [module-ci-node.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/module-ci-node.yml:1)
- Reusable Node CD template: [module-cd-github-packages.yml](/Users/automation2/Documents/workspace/xq-harness/.github/workflows/module-cd-github-packages.yml:1)
- Main Node onboarding doc: [onboarding.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/onboarding.md:1)
- Current repo module overview: [docs/modules/README.md](/Users/automation2/Documents/workspace/xq-harness/docs/modules/README.md:1)
- Workflow catalog: [docs/github-actions.md](/Users/automation2/Documents/workspace/xq-harness/docs/github-actions.md:1)
- Prior harness module decommission commit: `624e3f9`
