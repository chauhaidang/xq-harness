# xq-harness

Polyglot monorepo with independent build/test modules. Example modules live under
`modules/`; XQ testing packages are decoupled Level C modules with semver deps
from GitHub Packages.

## Quick start

```bash
./scripts/module list
./scripts/module ci node-example
make test MODULE=xq-common-kit
```

Requires [yq](https://github.com/mikefarah/yq). Install only the toolchain for
the module you work on — see [docs/modules/README.md](docs/modules/README.md).

**XQ packages** that depend on `@chauhaidang/*` need `NODE_AUTH_TOKEN` (GitHub
Packages) for `yarn install`.

## Layout

```text
modules.yaml          # canonical module registry and commands
scripts/module        # YAML-driven runner
modules/
  node-example/       # Yarn 4 (example)
  python-example/     # uv + pytest (example)
  java-example/       # Gradle + JUnit (example)
  ios-example/        # Xcode + XCTest (example)
  xq-common-kit/      # @chauhaidang/xq-common-kit (independent)
  xq-test-utils/      # depends on published xq-common-kit ^1.0.12
  xq-test-infra/      # depends on published xq-common-kit ^1.0.12
  xq-test-harness/    # Playwright BDD harness
  xq-test-harness-e2e-consumer/  # single dep on published harness
  xq-scripts/         # tarball release only
archive/
  xq-toolbox-workspace/  # legacy Yarn workspace (reference)
```

## XQ packages (Level C)

Each package has its own `yarn.lock`. Internal links use semver from GitHub
Packages, not `workspace:*`.

```bash
export NODE_AUTH_TOKEN=ghp_...   # read:packages
./scripts/module ci xq-common-kit
./scripts/module ci xq-test-utils
```

See [docs/MIGRATION_XQ_TOOLBOX.md](docs/MIGRATION_XQ_TOOLBOX.md) and
[docs/decisions/0009-xq-toolbox-level-c-decoupling.md](docs/decisions/0009-xq-toolbox-level-c-decoupling.md).

## Harness

This repo also uses the Harness operating model for agent-assisted development.
See [docs/HARNESS.md](docs/HARNESS.md).
