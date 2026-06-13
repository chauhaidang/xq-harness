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

## Integration Shape: Wrap In Place (Option A)

Packages stay under `xq-toolbox/` with their Yarn workspace layout unchanged.
Harness registers them in root `modules.yaml` and adds policy docs at the
xq-harness root.

Do **not** move packages into `modules/` yet. That would break workspace paths,
Task sources, and publish `repository.directory` metadata.

```text
xq-harness/
  modules.yaml              ← canonical module registry (includes xq-toolbox)
  scripts/module            ← YAML-driven runner
  docs/product/             ← living product contract (derived from legacy)
  xq-toolbox/               ← legacy monorepo (Yarn workspace root)
    packages/
    Taskfile.yml
```

## Phase 0 — Repository Hygiene (done / required)

| Step | Status | Action |
| --- | --- | --- |
| Copy legacy tree | Done | `xq-toolbox/` present |
| Remove nested `.git` | **Required** | `rm -rf xq-toolbox/.git` so parent repo tracks files |
| Register modules | Done | See `modules.yaml` |
| Prereqs | Manual | Node ≥ 18, Corepack, [Task](https://taskfile.dev/), [yq](https://github.com/mikefarah/yq) |

## Phase 1 — Mechanical Module Wiring (done)

Six harness modules registered:

```bash
./scripts/module list | rg '^xq'
./scripts/module ci xq-common-kit
make test MODULE=xq-toolbox    # full workspace via Task
```

Per-package modules delegate to Task at the workspace root because Yarn
workspace dependencies require a root `yarn install` and ordered builds
(`xq-common-kit` before `xq-test-utils` / `xq-test-infra`).

**Not registered as modules:**

- `xq-scripts` — tarball-only release via `task release:xq-scripts` + GH workflow
- `todo-app` demo — incomplete (`write-service` source missing); defer until fixed
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

## Phase 3 — Baseline Stories + Proof

Create story packets for existing behavior and attach verify commands:

```bash
scripts/bin/harness-cli init
scripts/bin/harness-cli intake \
  --type "maintenance request" \
  --summary "Baseline proof for xq-common-kit" \
  --lane normal

scripts/bin/harness-cli story add \
  --id US-TB-001 \
  --title "xq-common-kit unit tests pass" \
  --lane normal \
  --verify "./scripts/module test xq-common-kit"

scripts/bin/harness-cli story verify US-TB-001
```

Suggested baseline stories:

| ID | Module | Verify command |
| --- | --- | --- |
| US-TB-001 | xq-common-kit | `./scripts/module test xq-common-kit` |
| US-TB-002 | xq-test-utils | `./scripts/module test xq-test-utils` |
| US-TB-003 | xq-test-infra | `./scripts/module test xq-test-infra` |
| US-TB-004 | xq-test-harness | `./scripts/module test xq-test-harness` |
| US-TB-005 | e2e consumer | `./scripts/module test xq-test-harness-e2e-consumer` |

## Phase 4 — CI and Secrets

Port or replace legacy workflows:

| Legacy | Harness action |
| --- | --- |
| `.github/workflows/publish.yml` | Move to xq-harness root or call `./scripts/module ci xq-toolbox` |
| `release-xq-scripts.yml` | Keep tarball release path; needs `GH_TOKEN` |
| Missing `e2e-tests.yml` | Add when todo-app demo is complete |

**Secrets required:**

- `NODE_AUTH_TOKEN` — GitHub Packages install/publish
- `GH_TOKEN` — xq-scripts release, OpenAPI sync
- Docker — integration tests in xq-test-infra, todo-app demo

**Playwright:** harness package tests need browser install locally. CI may set
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` only when tests mock HTTP and do not
launch browsers (verify per package).

## Phase 5 — Agent Operating Loop

After baseline proof exists, all new work follows the standard harness loop
(`docs/HARNESS.md`):

1. Classify via `docs/FEATURE_INTAKE.md`
2. `harness-cli intake`
3. Read `docs/product/*` + story packet
4. Implement in lane (tiny / normal / high-risk)
5. `harness-cli story verify` / `./scripts/module ci <module>`
6. `harness-cli trace`

**High-risk triggers in xq-toolbox:**

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

1. Remove `xq-toolbox/.git` before first commit to xq-harness
2. Fix or drop incomplete `todo-app` demo (`write-service` missing)
3. Port publish workflow to xq-harness root
4. Split package READMEs into `docs/product/*` incrementally
5. Reconcile `.agents/skills/` with xq-harness agent skills
6. Decide fate of example modules (`node-example`, etc.) vs production modules

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
