# 0008 xq-toolbox Integration

Date: 2026-06-13

## Status

Superseded by [0009 xq-toolbox Level C module decoupling](0009-xq-toolbox-level-c-decoupling.md)

## Context

The legacy `xq-toolbox` monorepo (Yarn Berry workspaces, TypeScript testing
toolchain) was copied into `xq-harness/xq-toolbox/`. xq-harness provides a
polyglot module registry (`modules.yaml`), harness operating model, and agent
workflow. The legacy repo has its own Task orchestration, GitHub Packages
publishing, and package-level documentation.

## Decision

Integrate using **wrap-in-place (Option A)**:

1. Keep `xq-toolbox/` as the Yarn workspace root; do not relocate packages into
   `modules/` in the initial migration.
2. Register the workspace and each publishable/testable package in root
   `modules.yaml`, with per-package commands delegating to `xq-toolbox/Taskfile.yml`.
3. Derive living product contract in `docs/product/` from legacy READMEs and
   tests; do not treat `xq-toolbox/README.md` as permanent product truth.
4. Remove the nested `xq-toolbox/.git` directory so the parent repository
   tracks the imported tree.
5. Defer `todo-app` demo and `archive/poc/*` from module registration until
   sources are complete and proof commands are reliable.

## Alternatives Considered

1. **Move packages to `modules/`** — Rejected for initial migration because it
   breaks Yarn workspace paths, Task `dir:` references, and npm publish metadata.
2. **Submodule** — Rejected; goal is a single harness-operated repo, not dual remotes.
3. **Replace Task with harness-only commands** — Rejected; Task provides
   incremental builds and dependency ordering that `scripts/module` does not
   replicate yet.

## Consequences

Positive:

- Minimal disruption to existing package layout and publishing identifiers.
- Harness can run `./scripts/module ci xq-common-kit` from repo root.
- Product docs and stories can grow without rewriting the monorepo structure.

Tradeoffs:

- Two orchestrators (`scripts/module` and `task`) until Task is optional.
- Workspace install must run at `xq-toolbox/` root for any package module.
- Playwright and Docker prerequisites remain package-specific.

## Follow-Up

- Port `.github/workflows/publish.yml` to xq-harness CI.
- Create baseline harness stories with `story verify` commands.
- Expand `docs/product/*` from package README archaeology.
