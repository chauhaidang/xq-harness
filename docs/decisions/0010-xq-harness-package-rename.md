# 0010 xq-harness Package Rename (Registry Namespace)

Date: 2026-06-14

## Status

Accepted

## Context

Legacy xq-toolbox already publishes `@chauhaidang/xq-common-kit`,
`@chauhaidang/xq-test-utils`, `@chauhaidang/xq-test-infra`, and
`@chauhaidang/xq-test-harness` to GitHub Packages. The migrated Level C modules
in xq-harness initially reused those names and would collide with legacy registry
entries on publish.

## Decision

Publish harness-lineage packages under new names with an `xq-harness-` prefix:

| Module directory | Legacy npm name | Harness npm name |
| --- | --- | --- |
| `xq-common-kit` | `@chauhaidang/xq-common-kit` | `@chauhaidang/xq-harness-common-kit` |
| `xq-test-utils` | `@chauhaidang/xq-test-utils` | `@chauhaidang/xq-harness-test-utils` |
| `xq-test-infra` | `@chauhaidang/xq-test-infra` | `@chauhaidang/xq-harness-test-infra` |
| `xq-test-harness` | `@chauhaidang/xq-test-harness` | `@chauhaidang/xq-harness-test-harness` |
| `xq-test-harness-e2e-consumer` | (private) | `@chauhaidang/xq-harness-test-harness-e2e-consumer` |

Reset publishable package versions to **0.1.0** for a clean registry lineage.

**Monorepo internal installs** (paths use module directory names, not npm names):

```json
"@chauhaidang/xq-harness-common-kit": "portal:../xq-common-kit"
"@chauhaidang/xq-harness-test-harness": "file:../xq-test-harness"
```

`file:` for e2e-consumer avoids duplicate `@playwright/test` loads that occur
with `portal:` on the harness package.

**External consumers** install semver from GitHub Packages after publish, e.g.
`yarn add @chauhaidang/xq-harness-test-harness`.

Legacy `@chauhaidang/xq-*` packages (without `harness-`) remain the xq-toolbox
line; do not republish harness code under those names.

## Consequences

- First publish to GitHub Packages creates new package entities; no overwrite of
  legacy artifacts.
- Docs, imports, and skills reference the `xq-harness-*` names.
- Module registry keys (`xq-common-kit`, etc.) and paths under `modules/` are
  unchanged.

## Follow-Up

- Publish 0.1.0 lineage via per-module `cd-*.yml` workflows.
- Optionally switch e2e-consumer to semver once harness packages are on registry.
