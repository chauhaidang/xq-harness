# 0009 xq-toolbox Level C Module Decoupling

Date: 2026-06-13

## Status

Accepted

## Context

The legacy `xq-toolbox` monorepo used Yarn Berry workspaces with a shared
`node_modules` tree, `workspace:*` links, and a root `Taskfile.yml` as the
primary orchestrator. That model was copied into `xq-harness/xq-toolbox/` per
[ADR 0008 xq-toolbox integration](0008-xq-toolbox-integration.md).

As xq-harness matured, the workspace model conflicted with the polyglot module
registry in [ADR 0008 polyglot monorepo modules](0008-polyglot-monorepo-modules.md):

- Contributors had to learn two dependency graphs (`depends_on` in `modules.yaml`
  vs `workspace:*` in `package.json`).
- Onboarding docs referenced `cd xq-toolbox`, `task build:*`, and hoisted installs
  that no longer matched the repo layout.
- Independent module CI and GitHub Packages publishing required per-module
  lockfiles and semver boundaries.

## Decision

Decouple XQ npm packages into **Level C** independent modules:

1. Each publishable package lives at `modules/<module-key>/` with its own
   `package.json`, `yarn.lock`, and `.yarnrc.yml`.
2. Monorepo sibling dependencies use Yarn `portal:../<sibling>` (not
   `workspace:*`).
3. External consumers install semver from GitHub Packages (`@chauhaidang/xq-harness-*`
   per [ADR 0010](0010-xq-harness-package-rename.md)).
4. `modules.yaml` `depends_on` mirrors `portal:` links; CI validates parity via
   `scripts/check-module-deps.js`.
5. `scripts/module` is the sole build/test orchestrator for contributors — not
   `xq-toolbox/Taskfile.yml`.
6. Legacy workspace tree archived at `archive/xq-toolbox-workspace/` for
   reference only.

## Alternatives Considered

1. **Keep Yarn workspaces at `xq-toolbox/` root** — rejected; duplicates the
   module registry and blocks independent per-module CI.
2. **Relocate packages without portal links** — rejected; monorepo contributors
   need fast sibling iteration without publishing every change.
3. **Nx/Turborepo task graph** — rejected per ADR 0008; `depends_on` + validation
   is sufficient for the current module count.

## Consequences

Positive:

- One contributor story: `./scripts/module ci <name>` from repo root.
- Modules publish and version independently.
- `portal:` and `depends_on` stay aligned under CI enforcement.

Tradeoffs:

- Sibling deps must be declared in two manifests until a generator exists.
- Migration history remains in `docs/MIGRATION_XQ_TOOLBOX.md` (historical).

## Supersedes

[0008 xq-toolbox integration](0008-xq-toolbox-integration.md) — workspace-root
install and Task co-orchestration are no longer the operating model.

## Follow-ups

- Version sync helper: `modules.yaml` version == native project file (ADR 0008).
- Retire stale xq-toolbox references in package READMEs (ongoing hygiene).
