# Polyglot Modules

This repository hosts independent language modules. Each module builds and tests
on its own with its own lockfile (where applicable).

## Registry

`modules.yaml` at the repo root is the single source of truth for:

- module paths
- versions
- install / build / test commands

Do not duplicate those commands in the Makefile or CI workflows.

## Runner

```bash
./scripts/module list
./scripts/module ci node-example
make test MODULE=python-example
./scripts/module test-all
```

Requires [yq](https://github.com/mikefarah/yq).

## Example modules

Scaffold modules for polyglot layout reference. Not included in CI or
`make test-all` (`test_all: false` in `modules.yaml`). Run manually:

```bash
./scripts/module ci node-example
```

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
| `xq-test-harness-e2e-consumer` | 0.0.0 | `file:../xq-test-harness` |
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

## iOS project regeneration

When `project.yml` changes:

```bash
cd modules/ios-example
xcodegen generate
```

Commit the updated `ios-example.xcodeproj`.

## GitHub Actions

Each publishable module has its own **CI** (`ci-<module>.yml`) and **CD**
(`cd-<module>.yml`) workflow. Shared bootstrap lives in reusable templates under
`.github/workflows/reusable/`.

See [docs/github-actions.md](../github-actions.md) for template inputs, path
filters, and how module owners add pipelines.

## Versioning

Each module version is declared in `modules.yaml` and mirrored in the native
project file (`package.json`, `pyproject.toml`, Gradle `version`, Xcode
marketing version). Publishable XQ packages use per-module `cd-<module>.yml`
workflows; CD runs on `package.json` version bump to `main` or manual dispatch.
