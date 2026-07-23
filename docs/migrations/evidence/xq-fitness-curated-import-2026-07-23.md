# XQ Fitness curated import manifest

Issue: [#46](https://github.com/chauhaidang/xq-harness/issues/46)

Import date: 2026-07-23

Source archive: `xq-fitness-backend-source-2026-07-23.tar.gz`

Source SHA-256:
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`

Import commit: `c39cf5d` (`feat: import XQ Fitness backend modules`). This
follow-up record binds that immutable import to the approved archive and source
commits.

## Imported modules

| Module | Pinned source | Source version | Files | Curated tree SHA-256 |
| --- | --- | ---: | ---: | --- |
| `xq-fitness-write-service` | `chauhaidang/xq-fitness-write@49ebb1baa58c377b6e8281463db491d077ab086b` | `2.1.0` | 74 | `ee6b02eea51987c41a40b91f966a5e6fdfd78811e317af35331c10b07ff261b0` |
| `xq-fitness-db` | `chauhaidang/xq-fitness-db@450f6b6157f622dc3f6a98fdaa52953ce4c88ae3` | `1.0.0` | 28 | `f1d0b608088385874f6f5d2e2a1ec80f6c3e8ae3cd275f7e8e3e61a845efb1f0` |
| `xq-records` | `chauhaidang/xq-records@d9acc0fa21b16968c6cdf196c5e1ad63ff9a809b` | `1.0.0` | 22 | `66e2f417f07ed806fb902ed4a0f6f574646a2d918db7eeb1179d99637b54fa99` |

Tree hashes are SHA-256 values over the sorted per-file SHA-256 manifest. They
must be refreshed if the curated working tree changes before commit.

## Disposition

- Write-service runtime source, canonical OpenAPI, unit/component tests,
  component environment, generator input, and build/lint/test configuration
  were imported. The approved audit lock and deterministic dependency changes
  replaced the obsolete standalone dependency graph. Both Docker stages now use
  Node 22, and the image consumes registry credentials only as a BuildKit
  secret. The generated client remains an ignored, bootstrap-created private
  test dependency; it is not a `modules.yaml` dependency edge.
- Fitness database Prisma/schema inputs, tests, environment descriptors, and
  applicable tooling were imported. Standalone SQL is retained only under
  `docs/legacy-history`; the curated Dockerfile cannot replay it. The legacy
  production migration entry point was excluded. Issue #47 owns the executable
  verified baseline.
- XQ Records Prisma migration history, tests, PostgreSQL 18 image inputs,
  environment descriptors, and applicable tooling were imported. Repository
  metadata now points at the monorepo module and a sanitized local
  `.env.example` was added.
- All three modules have independent `version.yaml` files and registry entries,
  with no local `depends_on` edges between them or to `xq-test-infra`.

## Exclusions verified

No standalone `.npmrc`, `.env`, Git history, nested GitHub workflow, nested
agent configuration, generated client, generated Prisma client, `docker-init`,
JUnit XML, coverage, report, build output, rendered app spec, or standalone
decision map was imported. Source archive and raw acceptance evidence remain
ignored. Placeholder local database credentials are confined to disposable
test/example configuration; no production credential value is present.

## Verification

- `./scripts/module list`
- `./scripts/module info xq-fitness-write-service`
- `./scripts/module info xq-fitness-db`
- `./scripts/module info xq-records`
- `python3 scripts/validate-module-versions.py`
- OpenAPI operation recount: 20
- excluded-file, stale-package, credential-pattern, and generated-output scans
- `git diff --check`
