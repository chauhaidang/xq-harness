# Polyglot Modules

This repository hosts independent language modules. Each module builds and tests
on its own with its own lockfile (where applicable).

**Bringing a module from another GitHub repo?** Read
[Onboarding a module from another repository](./onboarding.md) first — sanitize
secrets and old CI in the source repo before opening a PR here.

## Registry

`modules.yaml` at the repo root is the single source of truth for:

- module paths
- versions
- install / build / test commands

Do not duplicate those commands in the Makefile or CI workflows.

## Runner

```bash
./scripts/module list
./scripts/module ci xq-common-kit
make test MODULE=harness-state
./scripts/module test-all
```

Requires [yq](https://github.com/mikefarah/yq).

## XQ packages (Level C — independent)

Each `modules/xq-*` package has its own `yarn.lock` and `.yarnrc.yml` for
GitHub Packages. **Harness-lineage** npm names use the `xq-harness-*` prefix
(ADR 0010). Monorepo sibling deps use Yarn `portal:`; external consumers use
semver after publish.

| Module | Version | npm package / dep |
| --- | --- | --- |
| `xq-common-kit` | 0.1.0 | `@chauhaidang/xq-harness-common-kit` |
| `xq-test-utils` | 0.1.0 | `portal:../xq-common-kit` |
| `xq-test-infra` | 0.1.0 | `portal:../xq-common-kit` |
| `xq-test-harness` | 0.1.0 | `@chauhaidang/xq-harness-test-harness` |
| `xq-test-harness-e2e-consumer` | 0.0.0 | `portal:../xq-test-harness` |
| `xq-scripts` | VERSION file | tarball release only |

**Prerequisites:** Node ≥ 18, Corepack. `NODE_AUTH_TOKEN` only needed when
installing published `@chauhaidang/xq-harness-*` from GitHub Packages (not for
`portal:` monorepo CI).

Shared TS config: `modules/tsconfig.base.json`. Shared registry template:
`modules/yarnrc.github-packages.yml`.

```bash
export NODE_AUTH_TOKEN=...
./scripts/module ci xq-test-utils
./scripts/module list-test-all
```

After changing an upstream package API, bump its version, publish to GitHub
Packages, then bump semver in downstream `package.json` files.

## Working on one module

```bash
cd modules/xq-harness-common-kit
yarn install --immutable && yarn test
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

Each module version is declared in `modules.yaml` and mirrored in the native
project file (`package.json`, `pyproject.toml`, Gradle `version`, Xcode
marketing version). Publishable XQ packages use per-module `cd-<module>.yml`
workflows; CD runs on `package.json` version bump to `main` or manual dispatch.
