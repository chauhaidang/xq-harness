# US-TB Baseline Proof (Level C modules)

## Status

implemented

## Lane

normal

## Product Contract

Each decoupled `modules/xq-*` package has a mechanical verify command.
`./scripts/module test <module>` or full `ci` must pass for baseline migration
acceptance.

## Relevant Product Docs

- `docs/product/xq-toolbox-overview.md`
- `docs/decisions/0009-xq-toolbox-level-c-decoupling.md`

## Stories

| ID | Module | Verify command | Proof layers |
| --- | --- | --- | --- |
| US-TB-001 | xq-common-kit | `./scripts/module test xq-common-kit` | unit |
| US-TB-002 | xq-test-utils | `./scripts/module test xq-test-utils` | unit |
| US-TB-003 | xq-test-infra | `./scripts/module test xq-test-infra` | unit |
| US-TB-004 | xq-test-harness | `./scripts/module test xq-test-harness` | unit + e2e |
| US-TB-005 | xq-test-harness-e2e-consumer | `./scripts/module test xq-test-harness-e2e-consumer` | e2e |

## Validation

```bash
make test MODULE=xq-common-kit   # or any module above
```

Last verified: all five module test commands passed (2026-06-14).

## Evidence

- CI: per-module `ci-*.yml` workflows (see [docs/github-actions.md](../github-actions.md))
- Fixed e2e-consumer test scripts: Yarn 4 `yarn exec bddgen` fails when
  `playwright-bdd` is only a transitive dependency; use `./node_modules/.bin/*`
  in package scripts instead.
