# XQ Harness — Consumer Catalogue

What you can install and use from this repository. **Harness-lineage** packages
publish under `@chauhaidang/xq-harness-*` on GitHub Packages (v0.1.0+).

Legacy xq-toolbox used shorter names (`@chauhaidang/xq-common-kit`, etc.).
Those remain on the registry as a separate product line — use the `xq-harness-*`
names below for code from this repo.

---

## Quick pick

| I need… | Package |
| --- | --- |
| Logger, config, YAML, JUnit→Markdown | `@chauhaidang/xq-harness-common-kit` |
| Postgres tests, wait-for-service, Jest config | `@chauhaidang/xq-harness-test-utils` |
| Docker Compose test environments | `@chauhaidang/xq-harness-test-infra` |
| Playwright API + Gherkin BDD backend tests | `@chauhaidang/xq-harness-test-harness` |
| OpenAPI sync / report scripts (tarball) | xq-scripts GitHub Release (not npm) |

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
yarn add @chauhaidang/xq-harness-common-kit
yarn add -D @chauhaidang/xq-harness-test-utils
yarn add -D @chauhaidang/xq-harness-test-infra
yarn add -D @chauhaidang/xq-harness-test-harness
```

**Playwright harness:** do not add `@playwright/test` or `playwright-bdd`
separately — they ship inside `@chauhaidang/xq-harness-test-harness`.

---

## Published packages

### `@chauhaidang/xq-harness-common-kit` (0.1.0)

**Purpose:** Small TypeScript utilities shared across XQ test tooling.

**Entry:** `@chauhaidang/xq-harness-common-kit`

| Export | Description |
| --- | --- |
| `logger`, `LOG_LEVELS`, `Logger` | Structured logging |
| `getConfig()` | Read and cache `xq.json` from cwd |
| `readYAML(path)` | Parse a YAML file |
| `generateRandomString(len?)` | Random string helper |
| `generateMarkdownFromJunit(xml)` | JUnit XML → Markdown report body |

**Docs:** [modules/xq-common-kit/README.md](modules/xq-common-kit/README.md)

---

### `@chauhaidang/xq-harness-test-utils` (0.1.0)

**Purpose:** Component and integration test helpers (Jest-oriented). Optional
Detox/mobile E2E helpers when `detox` peer is installed.

**Depends on:** `@chauhaidang/xq-harness-common-kit`

**Entry:** `@chauhaidang/xq-harness-test-utils`

| Area | Exports | Use when |
| --- | --- | --- |
| **Database** | `createDatabaseHelper`, `PostgresDatabaseHelper`, `DatabaseHelper`, types | Postgres integration tests |
| **Service readiness** | `waitForService`, `WaitForServiceOptions` | Poll HTTP/TCP before tests |
| **Reporting** | `generateTestReport`, `JunitMarkdownReporter`, types | JUnit XML → Markdown in CI |
| **Jest config** | `getComponentTestConfig` | Shared component-test Jest preset |
| **Detox config** | `createDetoxConfig`, `createE2eJestConfig` | Mobile E2E (requires `detox` peer) |
| **Detox app** | `App`, `LaunchOptions` | App launch / lifecycle wrapper |
| **Detox screen** | `screen`, `Matcher`, `WebMatcher` | Element actions and expectations |

**Subpath:** `@chauhaidang/xq-harness-test-utils/jest.component.config` — Jest
preset module (see package README).

**Bundled skills** (for agent tooling): `e2e-app`, `e2e-config`, `e2e-screen`
under `node_modules/@chauhaidang/xq-harness-test-utils/skills/`.

**Docs:** [modules/xq-test-utils/README.md](modules/xq-test-utils/README.md)

---

### `@chauhaidang/xq-harness-test-infra` (0.1.0)

**Purpose:** CLI to generate Docker Compose files from an XQ YAML spec and manage
test environments (up / down / logs / gateway).

**Depends on:** `@chauhaidang/xq-harness-common-kit`

**Binary:** `xq-infra` (after install)

| Command | Description |
| --- | --- |
| `xq-infra generate -f <spec.yaml>` | Emit `xq-compose.yml` from XQ spec |
| `xq-infra up` | Start services (detached) |
| `xq-infra down` | Stop and remove environment |
| `xq-infra logs [-f] [service]` | View or follow container logs |

**Runtime needs:** Docker Engine with Compose plugin.

**Docs:** [modules/xq-test-infra/README.md](modules/xq-test-infra/README.md)

---

### `@chauhaidang/xq-harness-test-harness` (0.1.0)

**Purpose:** Single-dependency Playwright API + Gherkin (playwright-bdd) harness
for backend black-box tests. Bundles `@playwright/test` and `playwright-bdd`.

| Subpath | Exports | Audience |
| --- | --- | --- |
| `.` | `test`, `expect`, `Given`, `When`, `Then`, `Step`, `XQFixture`, `XQApiClients` | **Default** — step files and bdd-world |
| `./config` | `defineApiHarnessConfig`, `mergeApiHarnessPlaywrightConfig`, `defineBddProject` | `playwright.config.ts` |
| `./advanced` | `mergeTests`, `createHarnessBdd` | Custom fixture merges |

**Typical consumer layout**

```text
your-repo/
  bdd-world.ts          # extend test, wire API clients into xq.apis
  playwright.config.ts  # defineApiHarnessConfig + importTestFrom
  features/**/*.feature
  steps/**/*.ts
  .features-gen/        # bddgen output (gitignore)
```

**Scripts in consumer `package.json`**

```json
{
  "scripts": {
    "test:bdd": "./node_modules/.bin/bddgen -c playwright.config.ts && ./node_modules/.bin/playwright test -c playwright.config.ts"
  }
}
```

Use `./node_modules/.bin/*` paths with Yarn 4 when `bddgen` is only a transitive
dependency.

**Bundled docs & skills**

- [CONSUMER-GUIDE.md](modules/xq-test-harness/docs/CONSUMER-GUIDE.md)
- `skills/xq-test-harness-bdd/` — agent setup checklist

**Docs:** [modules/xq-test-harness/README.md](modules/xq-test-harness/README.md)

---

## Dependency graph (published)

```text
@chauhaidang/xq-harness-common-kit
  ├── @chauhaidang/xq-harness-test-utils
  └── @chauhaidang/xq-harness-test-infra

@chauhaidang/xq-harness-test-harness     (no internal xq-harness deps)
  └── Playwright + playwright-bdd (bundled)
```

---

## Not published to npm

| Artifact | How to get it | Notes |
| --- | --- | --- |
| **xq-scripts** | GitHub Release tarball (`xq-scripts/v*`) | `sync-openapi.sh`, `generate-report.js`, `install-skills.js` |
| **xq-test-harness-e2e-consumer** | Monorepo only (`private`) | Dogfood example; not for external use |
| **Example modules** (`node-example`, etc.) | Clone repo | Polyglot runner demos only |

### xq-scripts (tarball)

| Script | Purpose |
| --- | --- |
| `scripts/sync-openapi.sh` | Download/generate OpenAPI clients from xq-apis |
| `scripts/generate-report.js` | HTML test report from JUnit |
| `scripts/install-skills.js` | Copy `skills/` from installed `@chauhaidang/*` into `.agents/skills/` |

See [modules/xq-scripts/README.md](modules/xq-scripts/README.md).

---

## Agent skills

Several packages ship `skills/` directories for Cursor-style agents. After
installing npm packages, optionally run `install-skills.js` from the xq-scripts
tarball to copy skills into your project's `.agents/skills/`.

| Package | Skills |
| --- | --- |
| `xq-harness-test-harness` | `xq-test-harness-bdd` |
| `xq-harness-test-utils` | `e2e-app`, `e2e-config`, `e2e-screen` |

---

## Versioning and registry

- **Registry:** `https://npm.pkg.github.com` (scope `@chauhaidang`)
- **Harness lineage:** `xq-harness-*` @ **0.1.0** (fresh line; see ADR 0010)
- **Publish workflow:** `.github/workflows/publish-xq-packages.yml` on version bumps

---

## Related decisions

- [0010 — Package rename (legacy vs harness)](docs/decisions/0010-xq-harness-package-rename.md)
- [0009 — Level C module decoupling](../docs/decisions/0009-xq-toolbox-level-c-decoupling.md)
