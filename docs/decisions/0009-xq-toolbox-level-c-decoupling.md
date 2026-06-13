# 0009 xq-toolbox Level C Decoupling

Date: 2026-06-13

## Status

Accepted

## Context

xq-toolbox was imported as a Yarn workspace under `xq-toolbox/` with
`workspace:*` links and Task orchestration. Harness Level A/B kept packages
coupled through a shared lockfile and `depends_on` ordering.

The team chose **Level C**: each package is an independent harness module with
semver dependencies resolved from GitHub Packages, matching how external
consumers install `@chauhaidang/*`.

## Decision

1. Move publishable packages to `modules/xq-*` with own `yarn.lock` and
   vendored Yarn 4.13.
2. Replace all `workspace:*` with published semver (e.g. `"^1.0.12"`).
3. Remove the `xq-toolbox` workspace shell; archive legacy tree at
   `archive/xq-toolbox-workspace/`.
4. e2e-consumer depends only on `"@chauhaidang/xq-test-harness": "^0.2.0"` and
   uses local mock server scripts (not sibling package paths).
5. CI and publish workflows use `./scripts/module ci` per module with
   `NODE_AUTH_TOKEN` for GitHub Packages.

## Alternatives Considered

1. **Level B (`file:` links)** — Rejected; still couples local checkout paths.
2. **Keep workspace for dev, semver in CI only** — Rejected; dual model adds
   confusion and drift risk.

## Consequences

Positive:

- Each module is independently installable and CI-able.
- e2e-consumer validates the published-package story.
- `make test-all` runs all modules without implicit workspace ordering.

Tradeoffs:

- Local dev on dependent packages requires `NODE_AUTH_TOKEN` and packages
  published at referenced versions (or manual version bump + publish).
- Cross-package API changes require publish before downstream modules pick them up.
- Slower iteration than workspace linking.

## Follow-Up

- Publish bumped versions after structural migration.
- Remove `archive/xq-toolbox-workspace/` once workflows are stable.
