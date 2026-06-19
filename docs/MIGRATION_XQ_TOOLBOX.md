# xq-toolbox Migration Plan

Legacy monorepo copied to `xq-toolbox/`. This document is the integration
pathway into xq-harness: module registry, harness operating model, CI, and
product truth.

## What Was Imported

| Path | Role |
| --- | --- |
| `xq-toolbox/packages/xq-common-kit` | Shared TS utilities (logger, config, yaml, junit→md) |
| `xq-toolbox/packages/xq-test-utils` | Jest/DB/wait-on/Detox helpers |
| `xq-toolbox/packages/xq-test-infra` | `xq-infra` CLI — Docker Compose test environments |
| `xq-toolbox/packages/xq-test-harness` | Playwright + playwright-bdd API harness |
| `xq-toolbox/packages/xq-test-harness-e2e-consumer` | Private dogfood consumer of the harness |
| `xq-toolbox/packages/xq-scripts` | Bash scripts; tarball release (not npm workspace package) |
| `xq-toolbox/Taskfile.yml` | Primary build/test orchestrator |
| `xq-toolbox/.github/workflows/` | Publish + xq-scripts release CI |

**Stack:** TypeScript, Yarn 4 Berry workspaces, Task, Jest, Playwright, Docker
(optional for infra integration tests).

**Publish target:** GitHub Packages (`@chauhaidang/*`).

## Integration Shape: Level C (done)

Packages live under `modules/xq-*` as independent harness modules with published
semver dependencies from GitHub Packages. Legacy workspace archived at
`archive/xq-toolbox-workspace/`. See
`docs/decisions/0009-xq-toolbox-level-c-decoupling.md`.

```text
xq-harness/
  modules.yaml              ← canonical module registry
  scripts/module            ← YAML-driven runner
  docs/product/             ← living product contract
  modules/xq-*/             ← independent packages (own yarn.lock each)
  archive/xq-toolbox-workspace/  ← legacy reference
```

## Phase 0 — Repository Hygiene (done)

| Step | Status | Action |
| --- | --- | --- |
| Copy legacy tree | Done | Archived at `archive/xq-toolbox-workspace/` |
| Remove nested `.git` | Done | Single git repo at xq-harness root |
| Register modules | Done | See `modules.yaml` |
| Prereqs | Manual | Node ≥ 18, Corepack, [yq](https://github.com/mikefarah/yq), `NODE_AUTH_TOKEN` |

## Phase 1 — Mechanical Module Wiring (done)

Six harness modules registered under `modules/`:

```bash
./scripts/module list | rg '^xq'
./scripts/module ci xq-common-kit
make test-all   # runs all modules with test_all: true
```

Each module installs and builds independently via semver from GitHub Packages.

**Not registered as modules:**

- `xq-scripts` — tarball-only release via GH workflow
- `todo-app` demo — incomplete in legacy archive; defer until fixed
- `archive/poc/xq-coconut` — dist-only archive

## Phase 2 — Product Archaeology (in progress)

Reverse-engineer product truth from code and package READMEs into
`docs/product/` (not a monolithic spec):

| Product doc | Source |
| --- | --- |
| `docs/product/xq-toolbox-overview.md` | Root README, package roles |
| Future: `test-harness.md` | `packages/xq-test-harness/README.md` |
| Future: `test-infra.md` | `packages/xq-test-infra/README.md` |

Mark confidence: **observed** (tests prove it), **documented** (README only),
**unknown** (gap).

## Phase 3 — Baseline Proof (done)

Baseline module verification is documented in
`docs/stories/US-TB-baseline-proof.md`.

```bash
make test-all
```

| ID | Module | Verify command |
| --- | --- | --- |
| US-TB-001 | xq-common-kit | `./scripts/module test xq-common-kit` |
| US-TB-002 | xq-test-utils | `./scripts/module test xq-test-utils` |
| US-TB-003 | xq-test-infra | `./scripts/module test xq-test-infra` |
| US-TB-004 | xq-test-harness | `./scripts/module test xq-test-harness` |
| US-TB-005 | e2e consumer | `./scripts/module test xq-test-harness-e2e-consumer` |

## Phase 4 — CI and Secrets (done)

Port or replace legacy workflows:

| Legacy | Replacement |
| --- | --- |
| `.github/workflows/publish.yml` | Move to xq-harness root or call `./scripts/module ci xq-toolbox` |
| `release-xq-scripts.yml` | Replaced by `cd-xq-scripts.yml` tarball workflow; needs `GH_TOKEN` |
| Missing `e2e-tests.yml` | Add when todo-app demo is complete |

**Secrets required:**

- `NODE_AUTH_TOKEN` — GitHub Packages install/publish
- `GH_TOKEN` — xq-scripts release, OpenAPI sync
- Docker — integration tests in xq-test-infra, todo-app demo

**Playwright:** test-harness package tests need browser install locally. CI may set
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` only when tests mock HTTP and do not
launch browsers (verify per package).

## Risk Areas

- Docker/registry auth (`xq-test-infra`)
- PostgreSQL helpers (`xq-test-utils`, todo-app)
- External OpenAPI sync (`xq-scripts` → `chauhaidang/xq-apis`)
- Playwright BDD public API surface (`xq-test-harness`)

## Dependency Graph

Packages are **not independent** like `modules/node-example`. They share
`xq-toolbox/yarn.lock`, hoisted `node_modules`, and `workspace:*` links.

```text
xq-common-kit                          (leaf — no internal workspace deps)
  ├── xq-test-utils                    workspace:* → xq-common-kit
  └── xq-test-infra                    workspace:* → xq-common-kit

xq-test-harness                        (leaf — no internal workspace deps)
  └── xq-test-harness-e2e-consumer     workspace:* → xq-test-harness
```

### How order is enforced (two layers)

1. **Task** (`xq-toolbox/Taskfile.yml`) — `build:xq-test-utils` depends on
   `build:xq-common-kit`; same for tests.
2. **Harness** (`modules.yaml` `depends_on`) — `./scripts/module build|test|ci`
   runs dependency modules first before the requested module.

Verify a module's graph:

```bash
./scripts/module info xq-test-utils
./scripts/module info xq-test-harness-e2e-consumer
```

### What is NOT independent

| Concern | Reality |
| --- | --- |
| `yarn install` | Always runs at `xq-toolbox/` root for any package module |
| Isolated node_modules per package | No — Yarn workspace hoisting |
| `make test-all` | Runs **example** modules + **`xq-toolbox` once**; skips per-package `xq-*` entries (`test_all: false`) |
| Publishing | Still per-package `@chauhaidang/*` on GitHub Packages |

To CI one package with dependencies satisfied:

```bash
./scripts/module ci xq-test-utils
# runs: xq-common-kit (install→build→test), then xq-test-utils
```

To CI the full workspace graph:

```bash
./scripts/module ci xq-toolbox
```

## Dual Orchestrators

| Tool | Use |
| --- | --- |
| `./scripts/module` / `make` | xq-harness polyglot registry; CI matrix entry |
| `task` in `xq-toolbox/` | Day-to-day monorepo work; incremental builds |

Do not duplicate commands in Makefile or CI — `modules.yaml` is canonical per
`docs/modules/README.md`.

## Open Items

1. Split package READMEs into `docs/product/*` incrementally (`test-harness.md`, `test-infra.md`, …)
2. Fix or drop incomplete `todo-app` demo in legacy archive (`write-service` missing)
3. Reconcile agent skills from legacy archive with xq-harness skills
4. Decide fate of example modules (`node-example`, etc.) vs production modules
5. Remove `archive/xq-toolbox-workspace/` once workflows are stable (per ADR 0009)
6. Publish bumped package versions after structural migration if registry drift appears

## Quick Verification

```bash
corepack enable
cd xq-toolbox && yarn install --immutable

# Single package
./scripts/module ci xq-common-kit

# Full workspace
./scripts/module ci xq-toolbox
make test-all   # runs ALL modules including examples — use selectively
```
