# GitHub Actions — modular CI/CD

CI (test on PR/push) and CD (publish on version bump) are **separate workflows**
per module. Module owners maintain their own caller files; shared steps live in
reusable templates.

## Layout

```text
.github/workflows/
  module-ci-node.yml              # CI template (Node / yarn modules)
  module-cd-github-packages.yml   # CD template (npm publish)
  module-cd-tarball.yml           # CD template (GitHub Release tarball)
  ci-<module>.yml                 # Per-module CI (owners edit)
  cd-<module>.yml                 # Per-module CD (owners edit)
```

Commands always run through [`scripts/module`](../scripts/module) and
[`modules.yaml`](../modules.yaml) — do not duplicate install/build/test in
workflow YAML.

## Reusable templates

### `module-ci-node.yml`

| Input | Default | Purpose |
| --- | --- | --- |
| `module` | (required) | Registry key, e.g. `xq-common-kit` |
| `node_version` | `22` | Node.js version |
| `playwright_skip_browser` | `false` | Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` |

Runs: `./scripts/module ci <module>`

### `module-cd-github-packages.yml`

| Input | Default | Purpose |
| --- | --- | --- |
| `module` | (required) | Registry key to publish |
| `node_version` | `22` | Node.js version |
| `playwright_skip_browser` | `false` | Skip browser download during CI gate |

Runs: `./scripts/module ci <module>` then `yarn npm publish` in `modules/<module>/`.

### `module-cd-tarball.yml`

| Input | Default | Purpose |
| --- | --- | --- |
| `module` | (required) | e.g. `xq-scripts` |
| `version_file` | `VERSION` | Version file inside module |
| `tag_prefix` | `xq-scripts/v` | Git tag prefix |
| `archive_prefix` | `xq-scripts-v` | Tarball filename prefix |

## CI vs CD triggers

| Workflow | When it runs |
| --- | --- |
| `ci-<module>.yml` | Pull request and push to `main` when `paths` match |
| `cd-<module>.yml` | Push to `main` when `package.json` (or `VERSION`) changes; **never on PR** |
| `cd-<module>.yml` | `workflow_dispatch` (manual publish) |

CD callers include a `version-check` job using:

```bash
node scripts/check-xq-version-changes.js --module <module>
```

Publish runs only when the version changed or the workflow was dispatched manually.

## CD permissions

Reusable workflows cannot elevate the `GITHUB_TOKEN` permissions granted by
their caller job. Each npm CD caller therefore grants its `publish` job
`contents: read` and `packages: write`; the tarball caller grants its `release`
job `contents: write`. Keep these permissions job-scoped so version checks and
unrelated jobs remain read-only.

Validate caller/callee permission parity locally:

```bash
./scripts/check-cd-workflow-permissions
```

## Current module workflows

| Module | CI | CD | Notes |
| --- | --- | --- | --- |
| `xq-common-kit` | `ci-xq-common-kit.yml` | `cd-xq-common-kit.yml` | npm publish |
| `xq-test-utils` | `ci-xq-test-utils.yml` | `cd-xq-test-utils.yml` | CI also watches `xq-common-kit` (portal dep) |
| `xq-test-infra` | `ci-xq-test-infra.yml` | `cd-xq-test-infra.yml` | CI also watches `xq-common-kit` |
| `xq-test-harness` | `ci-xq-test-harness.yml` | `cd-xq-test-harness.yml` | `playwright_skip_browser: true` |
| `xq-test-harness-e2e-consumer` | `ci-xq-test-harness-e2e-consumer.yml` | — | Private; CI only |
| `xq-scripts` | — | `cd-xq-scripts.yml` | Tarball release |
| `xq-ios-ui-test-framework` | `ci-xq-ios-ui-test-framework.yml` | `cd-xq-ios-ui-test-framework.yml` | Swift package; subtree Git release |

The iOS UI framework uses a dedicated macOS workflow rather than the Node
templates. CI runs module package validation and an XQ consumer compile check.
CD is tag-driven (`ios-ui-test-framework-vX.Y.Z`), validates `VERSION` and
`modules.yaml`, subtree-splits the module, pushes to the private distribution
repository, creates immutable `X.Y.Z` tags, and publishes release notes.

## Add CI/CD for a new module

1. Register the module in `modules.yaml`.
2. Copy `ci-xq-common-kit.yml` and `cd-xq-common-kit.yml` (if publishable).
3. Rename files to `ci-<module>.yml` / `cd-<module>.yml`.
4. Update `paths` filters for the module directory and any upstream deps.
5. Set template inputs (`module`, `playwright_skip_browser`, etc.).
6. Add lines to `.github/CODEOWNERS`.
7. If npm-publishable, add the module to `publishPrefixes` in
   `scripts/check-xq-version-changes.js`.
8. Bump `package.json` version when ready to trigger CD on merge to `main`.
9. Run `./scripts/check-cd-workflow-permissions` when adding or changing a CD caller.

## Ownership

Per-module caller workflows are listed in [`.github/CODEOWNERS`](../.github/CODEOWNERS).
Reusable templates (`module-*.yml`) should be changed only when the shared
bootstrap (Node, yq, `scripts/module`) changes.

## Local parity

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 ./scripts/module ci xq-common-kit
make test-all
```
