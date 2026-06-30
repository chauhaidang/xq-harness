# Contributor map

Single onboarding reference for the **current** xq-harness layout. For consumer
install, see [CATALOGUE.md](../../CATALOGUE.md).

Historical migration notes live in
[docs/MIGRATION_XQ_TOOLBOX.md](../MIGRATION_XQ_TOOLBOX.md) (archived).
Level C decoupling is recorded in
[ADR 0009](../decisions/0009-xq-toolbox-level-c-decoupling.md).

---

## Topology

```text
xq-harness/
  modules.yaml              ← canonical registry (paths, versions, commands)
  scripts/module            ← install / build / test / ci runner
  scripts/check-module-deps.js  ← validates depends_on vs portal:
  modules/
    xq-common-kit/          ← @chauhaidang/xq-harness-common-kit
    xq-test-utils/          ← portal:../xq-common-kit
    xq-test-infra/          ← portal:../xq-common-kit
    xq-test-harness/        ← standalone Playwright BDD harness
    xq-test-harness-e2e-consumer/  ← portal:../xq-test-harness (dogfood)
    xq-domain-test-mcp/     ← MCP REST testing server
    xq-scripts/             ← tarball scripts (not npm)
    harness-state/          ← project memory CLI (Python/uv)
    ios-*/                  ← iOS / Swift modules
  docs/                     ← contributor docs
  CATALOGUE.md              ← consumer package index
```

There is **no** `xq-toolbox/` directory. Do not use `task build:*` or
`workspace:*` links.

---

## First commands

Requires [yq](https://github.com/mikefarah/yq).

```bash
./scripts/module list
./scripts/module ci xq-common-kit
make test-all                    # modules with test_all: true
node scripts/check-module-deps.js   # registry ↔ package.json parity
```

Per-module from its directory:

```bash
cd modules/xq-common-kit
yarn install --immutable && yarn test
```

---

## Dependency model

Two manifests must agree for Node modules with sibling deps:

| Layer | Location | Purpose |
| --- | --- | --- |
| Registry | `modules.yaml` → `depends_on` | Runner build order (`scripts/module ci`) |
| Package | `package.json` → `portal:../…` | Yarn sibling resolution |

```text
xq-common-kit
  ├── xq-test-utils          depends_on + portal:../xq-common-kit
  └── xq-test-infra          depends_on + portal:../xq-common-kit

xq-test-harness              (no sibling deps)
  └── xq-test-harness-e2e-consumer   depends_on + portal:../xq-test-harness
```

After changing `portal:` links, update `depends_on` and run:

```bash
node scripts/check-module-deps.js
```

---

## Node XQ packages

| Module key | npm name | Notes |
| --- | --- | --- |
| `xq-common-kit` | `@chauhaidang/xq-harness-common-kit` | Foundation utilities |
| `xq-test-utils` | `@chauhaidang/xq-harness-test-utils` | Jest / DB helpers |
| `xq-test-infra` | `@chauhaidang/xq-harness-test-infra` | `xq-infra` Docker CLI |
| `xq-test-harness` | `@chauhaidang/xq-harness-test-harness` | Playwright + BDD |
| `xq-test-harness-e2e-consumer` | private dogfood consumer | |
| `xq-domain-test-mcp` | `@chauhaidang/xq-harness-domain-test-mcp` | Node 26 |
| `xq-scripts` | tarball only | `cd-xq-scripts.yml` |

Monorepo CI uses `portal:` — no `NODE_AUTH_TOKEN` required. Publishing uses
semver on GitHub Packages; see [docs/modules/README.md](./README.md).

---

## Agents and skills

1. Read [AGENTS.md](../../AGENTS.md) — pick a skill before acting.
2. Repo-level skills: `.agents/skills/`
3. Module skills: `modules/<name>/skills/` (copied to `.agents/` by consumers
   via `xq-scripts` `install-skills.js`)

Run `harness-state init` at session start when using project memory.

---

## Adding a module

See [onboarding.md](./onboarding.md) for external repo migration.

Quick checklist:

1. Register in `modules.yaml` (path, version, commands, `depends_on` if any).
2. Add `portal:` sibling links in `package.json` when applicable.
3. Run `node scripts/check-module-deps.js`.
4. Add `ci-<module>.yml` workflow from shared templates.
5. For publishable npm: add to `scripts/check-xq-version-changes.js`.

---

## Further reading

| Topic | Doc |
| --- | --- |
| Module registry details | [README.md](./README.md) |
| CI/CD | [docs/github-actions.md](../github-actions.md) |
| Package rename (legacy vs harness) | [ADR 0010](../decisions/0010-xq-harness-package-rename.md) |
| Polyglot modules | [ADR 0008](../decisions/0008-polyglot-monorepo-modules.md) |
| Consumer catalogue | [CATALOGUE.md](../../CATALOGUE.md) |
