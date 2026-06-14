# xq-toolbox packages (Level C)

**Status:** Decoupled into `modules/xq-*` (2026-06-13). Renamed npm packages per
ADR 0010 (2026-06-14).

Legacy workspace archived at `archive/xq-toolbox-workspace/`.

## Location

| Module key | Module path | npm package |
| --- | --- | --- |
| `xq-common-kit` | `modules/xq-common-kit/` | `@chauhaidang/xq-harness-common-kit` |
| `xq-test-utils` | `modules/xq-test-utils/` | `@chauhaidang/xq-harness-test-utils` |
| `xq-test-infra` | `modules/xq-test-infra/` | `@chauhaidang/xq-harness-test-infra` |
| `xq-test-harness` | `modules/xq-test-harness/` | `@chauhaidang/xq-harness-test-harness` |
| `xq-test-harness-e2e-consumer` | `modules/xq-test-harness-e2e-consumer/` | `@chauhaidang/xq-harness-test-harness-e2e-consumer` (private) |
| `xq-scripts` | `modules/xq-scripts/` | tarball release only |

Legacy xq-toolbox published `@chauhaidang/xq-*` (without `harness-`). Harness
line uses `xq-harness-*` names to avoid registry collision.

## Dependency model

```text
xq-common-kit                    @chauhaidang/xq-harness-common-kit
  ├── xq-test-utils              portal:../xq-common-kit (monorepo)
  └── xq-test-infra              portal:../xq-common-kit (monorepo)

xq-test-harness                  @chauhaidang/xq-harness-test-harness
  └── xq-test-harness-e2e-consumer   portal:../xq-test-harness (monorepo)
```

External consumers install semver from GitHub Packages after publish, e.g.
`yarn add @chauhaidang/xq-harness-test-harness`.

## CI

```bash
./scripts/module ci xq-common-kit
make test-all
```

## Publishing

Workflows: per-module `cd-*.yml` (see [docs/github-actions.md](../github-actions.md))

Version detection: `scripts/check-xq-version-changes.js`

## Related docs

- `docs/decisions/0010-xq-harness-package-rename.md`
- `docs/decisions/0009-xq-toolbox-level-c-decoupling.md`
- `docs/MIGRATION_XQ_TOOLBOX.md`
