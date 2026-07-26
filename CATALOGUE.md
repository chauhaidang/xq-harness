# XQ Harness — Consumer Catalogue

What you can install and use from this repository. **Harness-lineage** packages
publish under `@chauhaidang/xq-harness-*` on GitHub Packages (v0.1.0+).

Legacy xq-toolbox used shorter names (`@chauhaidang/xq-common-kit`, etc.).
Those remain on the registry as a separate product line — use the `xq-harness-*`
names below for code from this repo.

---

## Quick pick

| I need…                                         | Package                                   |
| ----------------------------------------------- | ----------------------------------------- |
| Logger, config, YAML, JUnit→Markdown            | `@chauhaidang/xq-harness-common-kit`      |
| Postgres tests, wait-for-service, Jest config   | `@chauhaidang/xq-harness-test-utils`      |
| Docker Compose test environments                | `@chauhaidang/xq-harness-test-infra`      |
| All bundled agent skills in one install         | `@chauhaidang/xq-skills`                  |
| OpenAPI sync / report scripts (tarball)         | xq-scripts GitHub Release (not npm)       |

---

## Install prerequisites

- **Node.js** ≥ 18
- **GitHub Packages auth** — token with `read:packages`

```ini
# .npmrc (project root or user-level)
@chauhaidang:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
# examples
npm install @chauhaidang/xq-harness-common-kit
npm install --save-dev @chauhaidang/xq-harness-test-utils
npm install --save-dev @chauhaidang/xq-harness-test-infra
npm install --save-dev @chauhaidang/xq-skills
```

---

## Published packages

### `@chauhaidang/xq-harness-common-kit` (0.1.0)

**Purpose:** Small TypeScript utilities shared across XQ test tooling.

**Entry:** `@chauhaidang/xq-harness-common-kit`

| Export                           | Description                       |
| -------------------------------- | --------------------------------- |
| `logger`, `LOG_LEVELS`, `Logger` | Structured logging                |
| `getConfig()`                    | Read and cache `xq.json` from cwd |
| `readYAML(path)`                 | Parse a YAML file                 |
| `generateRandomString(len?)`     | Random string helper              |
| `generateMarkdownFromJunit(xml)` | JUnit XML → Markdown report body  |

**Docs:** [modules/xq-common-kit/README.md](modules/xq-common-kit/README.md)

---

### `@chauhaidang/xq-harness-test-utils` (0.1.0)

**Purpose:** Component and integration test helpers (Jest-oriented). Optional
Detox/mobile E2E helpers when `detox` peer is installed.

**Depends on:** `@chauhaidang/xq-harness-common-kit`

**Entry:** `@chauhaidang/xq-harness-test-utils`

| Area                  | Exports                                                                   | Use when                           |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| **Database**          | `createDatabaseHelper`, `PostgresDatabaseHelper`, `DatabaseHelper`, types | Postgres integration tests         |
| **Service readiness** | `waitForService`, `WaitForServiceOptions`                                 | Poll HTTP/TCP before tests         |
| **Reporting**         | `generateTestReport`, `JunitMarkdownReporter`, types                      | JUnit XML → Markdown in CI         |
| **Jest config**       | `getComponentTestConfig`                                                  | Shared component-test Jest preset  |
| **Detox config**      | `createDetoxConfig`, `createE2eJestConfig`                                | Mobile E2E (requires `detox` peer) |
| **Detox app**         | `App`, `LaunchOptions`                                                    | App launch / lifecycle wrapper     |
| **Detox screen**      | `screen`, `Matcher`, `WebMatcher`                                         | Element actions and expectations   |

**Subpath:** `@chauhaidang/xq-harness-test-utils/jest.component.config` — Jest
preset module (see package README).

**Bundled skills** (for agent tooling): `e2e-app`, `e2e-config`, `e2e-screen`
under `node_modules/@chauhaidang/xq-harness-test-utils/skills/`.

**Docs:** [modules/xq-test-utils/README.md](modules/xq-test-utils/README.md)

---

### `@chauhaidang/xq-harness-test-infra` (0.1.1)

**Purpose:** CLI to generate Docker Compose files from an XQ YAML spec and manage
test environments (up / down / logs / gateway).

**Depends on:** `@chauhaidang/xq-harness-common-kit`

**Binary:** `xq-infra` (after install)

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `xq-infra generate -f <spec.yaml>` | Emit `xq-compose.yml` from XQ spec |
| `xq-infra up`                      | Start services (detached)          |
| `xq-infra down`                    | Stop and remove environment        |
| `xq-infra logs [-f] [service]`     | View or follow container logs      |

**Runtime needs:** Docker Engine with Compose plugin.

**Docs:** [modules/xq-test-infra/README.md](modules/xq-test-infra/README.md)

---

### `@chauhaidang/xq-skills` (0.1.1)

**Purpose:** Single install that ships all XQ agent skill Markdown for consumer
projects. No runtime code — only `skills/<name>/SKILL.md` files.

**Install and copy into your agent directory:**

```bash
npm install --save-dev @chauhaidang/xq-skills
node path/to/xq-scripts/scripts/install-skills.js
```

**Bundled skills:** `e2e-app`, `e2e-config`, `e2e-screen`, `xq-kraken`

**Docs:** [modules/xq-skills/README.md](modules/xq-skills/README.md)

---

## Dependency graph (published)

```text
@chauhaidang/xq-harness-common-kit
  ├── @chauhaidang/xq-harness-test-utils
  └── @chauhaidang/xq-harness-test-infra

@chauhaidang/xq-skills                     (no internal xq-harness deps)
  └── skills only — central agent skill bundle
```

---

## Not published to npm

| Artifact                         | How to get it                            | Notes                                                        |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **xq-scripts**                   | GitHub Release tarball (`xq-scripts/v*`) | `sync-openapi.sh`, `generate-report.js`, `install-skills.js` |

### xq-scripts (tarball)

| Script                       | Purpose                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scripts/sync-openapi.sh`    | Download/generate OpenAPI clients from xq-apis                                                                            |
| `scripts/generate-report.js` | HTML test report from JUnit                                                                                               |
| `scripts/install-skills.js`  | Copy `skills/` from installed XQ packages into `.agents/skills/`; use `--include-global` to also scan global npm packages |

See [modules/xq-scripts/README.md](modules/xq-scripts/README.md).

---

## Agent skills

Several packages ship `skills/` directories for Cursor-style agents. After
installing npm packages, optionally run `install-skills.js` from the xq-scripts
tarball to copy skills into your project's `.agents/skills/`.

For globally installed tools, run it with `--include-global` so global
`@chauhaidang/*/skills/` directories are scanned too.

Install `@chauhaidang/xq-skills` to get every skill below in one package.

| Package                  | Skills                                |
| ------------------------ | ------------------------------------- |
| `@chauhaidang/xq-skills` | all skills in this table              |
| `xq-harness-test-utils`  | `e2e-app`, `e2e-config`, `e2e-screen` |

---

## Versioning and registry

- **Registry:** `https://npm.pkg.github.com` (scope `@chauhaidang`)
- **Harness lineage:** `xq-harness-*` @ **0.1.0** (fresh line; see ADR 0010)
- **Publish:** per-module `cd-<module>.yml` workflows on version bump to `main` (see [docs/github-actions.md](docs/github-actions.md))

---

## Related decisions

- [0010 — Package rename (legacy vs harness)](docs/decisions/0010-xq-harness-package-rename.md)
- [0009 — Level C module decoupling](../docs/decisions/0009-xq-toolbox-level-c-decoupling.md)
