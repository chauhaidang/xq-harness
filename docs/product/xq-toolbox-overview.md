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
| `xq-scripts` | `modules/xq-scripts/` | tarball release only |

Legacy xq-toolbox published `@chauhaidang/xq-*` (without `harness-`). Harness
line uses `xq-harness-*` names to avoid registry collision.

## Dependency model

```text
xq-common-kit                    @chauhaidang/xq-harness-common-kit
  ├── xq-test-utils              @chauhaidang/xq-harness-common-kit
  └── xq-test-infra              @chauhaidang/xq-harness-common-kit
```

External consumers install semver from GitHub Packages after publish.

## CI

```bash
./scripts/module ci xq-common-kit
make test-all
```

## Publishing

Workflows: per-module `cd-*.yml` (see [docs/github-actions.md](../github-actions.md))

Version detection: `scripts/check-registry-version-changes.py`

## Related docs

- `docs/decisions/0010-xq-harness-package-rename.md`
- `docs/decisions/0009-xq-toolbox-level-c-decoupling.md`
- `docs/MIGRATION_XQ_TOOLBOX.md`
