# Python BasedPyright Module Template

Copy this template into a Python module when it needs a standard BasedPyright
type-checking setup.

## Files

```text
pyproject.toml
src/python_basedpyright_example/__init__.py
tests/test_import.py
```

After copying:

1. Rename the project in `pyproject.toml`.
2. Replace `src/python_basedpyright_example` with the module import package.
3. Update `[tool.basedpyright].include` if the module uses different source
   directories.
4. Commit the generated `uv.lock` after running `uv sync`.
5. Register the module in `modules.yaml`.

## `modules.yaml`

```yaml
  my-python-module:
    path: modules/my-python-module
    language: python
    version: 0.1.0
    test_all: false
    toolchain:
      python: "3.12"
      uv: required
      basedpyright: required
    commands:
      install: uv sync --locked
      build: uv run basedpyright && uv build
      test: uv run pytest
```

For application-only modules that do not build a wheel, use the same
`basedpyright` command in `build` and replace `uv build` with the module's real
validation command.

## CI

Create a caller workflow that uses `.github/workflows/module-ci-python.yml`:

```yaml
name: CI my-python-module

on:
  pull_request:
    paths: &paths
      - modules/my-python-module/**
      - modules.yaml
      - scripts/module
      - .github/workflows/ci-my-python-module.yml
      - .github/workflows/module-ci-python.yml
  push:
    branches: [main]
    paths: *paths

concurrency:
  group: ci-my-python-module-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    uses: ./.github/workflows/module-ci-python.yml
    with:
      module: my-python-module
```

BasedPyright reads `[tool.basedpyright]` from `pyproject.toml`, so each module
keeps its type-checking settings next to its package metadata and lockfile.
