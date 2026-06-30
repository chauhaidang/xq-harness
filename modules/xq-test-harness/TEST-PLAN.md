# Test plan: `@chauhaidang/xq-harness-test-harness`

## Tier A — smoke

| ID | Case | Expect |
|----|------|--------|
| T1 | `yarn build` in package | `dist/` contains `index.js`, `config.js`, `advanced.js` |
| T2 | `yarn test` in package | bddgen + Playwright: contract specs + dogfood scenario pass |
| T3 | `mergeApiHarnessPlaywrightConfig` contract tests | bdd + contract project order; no default `use.channel`; `overrides.use` merge |

## Tier B — monorepo integration

| ID | Case | Expect |
|----|------|--------|
| B1 | `./scripts/module test xq-test-harness-e2e-consumer` | Consumer runs BDD with harness as primary dep |
| B2 | Parallel `./scripts/module test` | Dogfood mock **19999**, consumer mock **19998**, no port clash |

## Tier C — publishing (manual / CI)

| ID | Case | Expect |
|----|------|--------|
| C1 | Version bump on `main` | `check-xq-version-changes.js` lists `xq-test-harness`; publish job runs |
| C2 | Consumer install doc | Single `@chauhaidang/xq-harness-test-harness` devDependency documented |
