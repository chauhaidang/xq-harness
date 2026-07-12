# Polyglot Modules

This repository hosts independent language modules. Each module builds and tests
on its own with its own lockfile (where applicable).

**Bringing a module from another GitHub repo?** Read
[Onboarding a module from another repository](./onboarding.md) first — sanitize
secrets and old CI in the source repo before opening a PR here.

## Registry

`modules.yaml` at the repo root is the execution registry for:

- module paths
- install / build / test commands

Each module's `version.yaml` is its single source of truth for semantic version,
newest-first changelog entries, and approved native mirrors.

Do not duplicate those commands in the Makefile or CI workflows.

## Runner

```bash
./scripts/module list
./scripts/module ci xq-common-kit
make test MODULE=xq-domain-test-mcp
./scripts/module test-all
```

Requires [yq](https://github.com/mikefarah/yq).

## POCs

`modules/poc` is the repo home for prototypes, learning spikes, and exploratory
initiatives before they justify a durable module. It is registered in
`modules.yaml` with no-op commands and `test_all: false`, so it can be run
manually through `./scripts/module ci poc` without joining the default CI set.

## MCP modules

`xq-domain-test-mcp` is a Python/uv MCP server module for REST API testing in
business-specific E2E API scenario workflows. It exposes a stdio command named
`xq-domain-test-mcp`; agents configure an environment and call REST primitives
while keeping scenario Markdown business-readable.

```bash
./scripts/module ci xq-domain-test-mcp
```

## XQ packages (Level C — independent)

Node packages run through module-local npm commands declared in `modules.yaml`.
Modules that publish to GitHub Packages keep `publishConfig` in `package.json`.
**Harness-lineage** npm names use the `xq-harness-*` prefix (ADR 0010).
Cross-module consumers use semver after publish.

| Module | Version | npm package / dep |
| --- | --- | --- |
| `xq-common-kit` | 0.1.0 | `@chauhaidang/xq-harness-common-kit` |
| `xq-test-utils` | 0.1.0 | `@chauhaidang/xq-harness-common-kit` |
| `xq-test-infra` | 0.1.1 | `@chauhaidang/xq-harness-common-kit` |
| `xq-skills` | 0.1.0 | `@chauhaidang/xq-skills` |
| `xq-scripts` | 1.0.2 | tarball release only (`VERSION` mirror) |

**Prerequisites:** Node ≥ 22 with npm available. `NODE_AUTH_TOKEN` only needed when
installing published `@chauhaidang/xq-harness-*` from GitHub Packages.

```bash
export NODE_AUTH_TOKEN=...
./scripts/module ci xq-test-utils
./scripts/module test-all
```

After changing an upstream package API, bump its version, publish to GitHub
Packages, then bump semver in downstream `package.json` files.

## Working on one module

```bash
cd modules/xq-common-kit
npm install && npm test
```

Or from the repo root:

```bash
./scripts/module test xq-common-kit
```

## Python BasedPyright modules

Use [`docs/templates/python-basedpyright-module`](../templates/python-basedpyright-module/)
when a Python module needs the standard BasedPyright type-checking setup.
The template includes:

- `pyproject.toml` dev dependencies for `basedpyright` and `pytest`
- `[tool.basedpyright]` settings scoped to module-local `src` and `tests`
- execution environments so tests can import module code from `src`
- a smoke import test that keeps the scaffold buildable

Register the module through `modules.yaml` and keep the runner commands there:

```yaml
commands:
  install: uv sync --locked
  build: uv run basedpyright && uv build
  test: uv run pytest
```

For GitHub Actions, create a caller workflow that uses
`.github/workflows/module-ci-python.yml`.

## iOS project regeneration

When `project.yml` changes:

```bash
cd modules/ios-xq-finance-app
xcodegen generate
```

Commit the updated `ios-xq-finance-app.xcodeproj`.

## iOS React Native shell adoption

Use [iOS React Native Shell Adoption Guide](./ios-react-native-shell-adoption.md)
when a consumer wants a native iOS shell that validates a remote manifest and
mounts a React Native payload through an embedded RN runtime.

## GitHub Actions

Each publishable module has its own **CI** (`ci-<module>.yml`) and **CD**
(`cd-<module>.yml`) workflow. Shared bootstrap lives in reusable `module-*.yml`
templates at the top level of `.github/workflows/`.

See [docs/github-actions.md](../github-actions.md) for template inputs, path
filters, and how module owners add pipelines.

## Versioning

Each module declares its current `version` and newest-first `changelog` in its
own `version.yaml`. The first changelog item must match the current version and
every item must include non-empty `changes`. Any module-native copy is declared
under `mirrors` and must match exactly.

Publishable modules still keep native manifest versions because package
managers and platform toolchains require them, but those fields are mirrors,
not authorities. After adding a release, run
`./scripts/module sync-version <module>` to update native files. CI and CD
validate the result, and CD detects changes from that module's `version.yaml`.
