# 0008 Polyglot Monorepo Modules

Date: 2026-06-13

## Status

Accepted

## Context

The repository needs a single home for multiple independent application modules
across Node.js, Python, Java, and iOS without cross-module build dependencies.
Build and test automation must stay consistent for humans, agents, and CI while
keeping deploy out of scope for the first iteration.

## Decision

Adopt a polyglot monorepo layout with:

- root `modules.yaml` as the canonical registry for module paths, versions, and
  install/build/test commands
- `scripts/module` as the YAML-driven runner used by Make and GitHub Actions
- independent modules under `modules/<name>/`
- Yarn 4 for Node, uv for Python, Gradle for Java, Xcode/xcodegen for iOS
- GitHub Actions jobs filtered by changed module paths
- per-module versioning controlled centrally in `modules.yaml`

Deploy pipelines are explicitly deferred.

## Alternatives Considered

1. Per-module Makefiles with duplicated commands — rejected because command
   strings would drift from CI.
2. Nx or Bazel — rejected as unnecessary for independent modules with no shared
   build graph.
3. npm instead of Yarn — rejected per project preference for Yarn 4.

## Consequences

Positive:

- One registry drives local commands and CI.
- Modules can evolve independently.
- Contributors install only the toolchains they need.

Tradeoffs:

- iOS jobs require macOS runners in GitHub Actions.
- The runner depends on `yq`.
- Node uses a vendored Yarn binary when Corepack is unavailable.

## Follow-ups

- Add deploy jobs per module when targets are chosen.
- Add a version sync helper to mirror `modules.yaml` into native project files.
