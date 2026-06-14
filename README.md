# xq-harness

Monorepo for **XQ testing libraries** and a polyglot module runner. Publishable
packages ship to GitHub Packages as `@chauhaidang/xq-harness-*`.

## For consumers

Install published packages in your own repo. Start here:

- **[exposure/catalogue.md](exposure/catalogue.md)** — package index, APIs, CLIs, and install notes
- [modules/xq-test-harness/docs/CONSUMER-GUIDE.md](modules/xq-test-harness/docs/CONSUMER-GUIDE.md) — Playwright BDD harness setup

Registry scope: `@chauhaidang`. Requires a GitHub token with `read:packages`
(`NODE_AUTH_TOKEN` in CI).

```ini
# .npmrc
@chauhaidang:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
yarn add @chauhaidang/xq-harness-test-harness
```

Legacy xq-toolbox packages (`@chauhaidang/xq-common-kit`, `@chauhaidang/xq-test-*`
without the `harness-` prefix) are a separate line — do not confuse them with
the harness packages listed in the catalogue.

## For contributors

Run one module:

```bash
./scripts/module list
make ci MODULE=xq-common-kit
make test-all          # all xq modules with test_all: true
```

Requires [yq](https://github.com/mikefarah/yq) and the toolchain for the module
you touch (Node 18+, etc.). See [docs/modules/README.md](docs/modules/README.md).

## Repository layout

```text
modules.yaml              # module registry (paths, versions, commands)
scripts/module            # install / build / test / ci runner
exposure/catalogue.md     # consumer-facing package index
modules/
  xq-common-kit/          # shared TS utilities
  xq-test-utils/          # Jest / DB / Detox helpers
  xq-test-infra/          # xq-infra CLI (Docker test environments)
  xq-test-harness/        # Playwright + Gherkin API harness
  xq-scripts/             # release tarball scripts (not npm)
  *-example/              # polyglot layout examples (not published)
docs/                     # harness operating model + decisions
```

## Harness (agent workflow)

This repo uses the Harness model for agent-assisted development.
See [docs/HARNESS.md](docs/HARNESS.md).

## Further reading

| Topic | Doc |
| --- | --- |
| Module registry | [docs/modules/README.md](docs/modules/README.md) |
| Package rename (legacy vs harness) | [docs/decisions/0010-xq-harness-package-rename.md](docs/decisions/0010-xq-harness-package-rename.md) |
| Migration history | [docs/MIGRATION_XQ_TOOLBOX.md](docs/MIGRATION_XQ_TOOLBOX.md) |
