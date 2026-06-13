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
GitHub Packages. Internal dependencies use **published semver**, not workspace
links.

| Module | Version | Registry dep |
| --- | --- | --- |
| `xq-common-kit` | 1.0.12 | — |
| `xq-test-utils` | 2.0.1 | `@chauhaidang/xq-common-kit` ^1.0.12 |
| `xq-test-infra` | 1.0.3 | `@chauhaidang/xq-common-kit` ^1.0.12 |
| `xq-test-harness` | 0.2.0 | — |
| `xq-test-harness-e2e-consumer` | 0.0.0 | `@chauhaidang/xq-test-harness` ^0.2.0 |
| `xq-scripts` | VERSION file | tarball release only |

**Prerequisites:** Node ≥ 18, Corepack, `NODE_AUTH_TOKEN` with `read:packages`
when installing modules that depend on other `@chauhaidang/*` packages.

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
cd modules/xq-common-kit
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

## Versioning

Each module version is declared in `modules.yaml` and mirrored in the native
project file (`package.json`, `pyproject.toml`, Gradle `version`, Xcode
marketing version). Publishable XQ packages use `yarn npm publish` from their
module directory when CI detects a version bump.
