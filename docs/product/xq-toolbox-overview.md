# xq-toolbox packages (Level C)

**Status:** Decoupled into `modules/xq-*` (2026-06-13).

Legacy workspace archived at `archive/xq-toolbox-workspace/`. See
`docs/decisions/0009-xq-toolbox-level-c-decoupling.md`.

## Location

| Package | Module path |
| --- | --- |
| `xq-common-kit` | `modules/xq-common-kit/` |
| `xq-test-utils` | `modules/xq-test-utils/` |
| `xq-test-infra` | `modules/xq-test-infra/` |
| `xq-test-harness` | `modules/xq-test-harness/` |
| `xq-test-harness-e2e-consumer` | `modules/xq-test-harness-e2e-consumer/` |
| `xq-scripts` | `modules/xq-scripts/` |

## Dependency model (published semver)

```text
xq-common-kit                    npm: @chauhaidang/xq-common-kit ^1.0.12
  ├── xq-test-utils
  └── xq-test-infra

xq-test-harness                  npm: @chauhaidang/xq-test-harness ^0.2.0
  └── xq-test-harness-e2e-consumer   (single published dependency)
```

Each module installs independently via `./scripts/module ci <name>`. Downstream
modules fetch upstream packages from GitHub Packages — no shared workspace.

## CI

```bash
export NODE_AUTH_TOKEN=...   # read:packages
./scripts/module ci xq-common-kit
./scripts/module ci xq-test-utils
```

## Publishing

Workflow: `.github/workflows/publish-xq-packages.yml`

Version detection: `scripts/check-xq-version-changes.js`

## Related docs

- `docs/decisions/0009-xq-toolbox-level-c-decoupling.md`
- `docs/MIGRATION_XQ_TOOLBOX.md` (historical migration notes)
