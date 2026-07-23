# XQ Fitness backend monorepo onboarding specification

Status: approved and planning-unblocked; replacement snapshot acceptance #61
passed; curated module import #46 landed in commit `c39cf5d`

Source map: [Map the XQ Fitness backend monorepo onboarding](https://github.com/chauhaidang/xq-harness/issues/32)

Snapshot date: 2026-07-20

## Planning readiness

For this migration, **planning-unblocked** means an execution ticket has settled
scope, inputs, accountable roles, acceptance evidence, rollback or recovery
behavior, and every decision needed to begin safely. It does not remove genuine
execution dependencies or production safety gates.

Live-production discovery is split from environment configuration to avoid a
dependency inversion in the original slice order:

- a dedicated read-only production preflight runs after curated import and
  before the two database tracer bullets; it captures the sanitized Neon schema,
  ledger, permission, invariant, and recovery evidence those tickets consume;
- production environment creation, credential isolation, and mutation-capable
  access remain in the later environment-readiness slice after CI/CD entry
  points exist; and
- later rollout gates refresh and compare the preflight evidence before any
  production mutation instead of assuming the earlier snapshot is still
  current.

The preflight commits durable sanitized manifests under
`docs/migrations/evidence/`. These manifests contain only the minimum
reviewable facts and checksums needed by later tickets; they contain no row
contents, connection strings, credential values, or unsanitized provider
responses. Raw command output is retained only as a short-lived protected
workflow artifact and is not committed or copied into issue comments. The
manifest records the producing run, capture time, target identity in
non-sensitive form, sanitization policy version, and hashes that bind it to the
protected raw evidence.

GitHub issue #60 and the affected execution tickets encode this split. The
immutable database-image transfer, cutover thresholds, observation cadence, and
standalone retirement order are also fixed below. The ticket map has no known
remaining planning fog; execution still follows each ticket's dependencies and
STOP conditions.

## Objective

Onboard the archived XQ Fitness backend into `xq-harness` as three independently
versioned modules while preserving both live Neon databases, the DigitalOcean
application, production data, and the complete v1 mobile gateway contract. The
monorepo must become the reproducible source of builds, migrations, releases,
and deployment evidence without importing standalone Git history.

This document is the implementation contract assembled from the approved
decisions in the onboarding map. The linked issues remain the decision history.
If implementation evidence conflicts with this document, stop and amend the
design through the issue process; do not silently change production behavior.

## Non-goals

- Moving away from DigitalOcean App Platform, Neon, GHCR, GitHub Packages, raw
  `pg` in the write service, or the existing public gateway.
- Adding product features or changing authentication, authorization, CORS,
  transport policy, route prefixes, or v1 semantics during onboarding.
- Combining the two Neon databases, adding a runtime consumer for `xq-records`,
  or publishing an `xq-records` Prisma-client package before a consumer contract
  exists.
- Replaying legacy fitness SQL on production, recreating either database,
  exporting production row contents into CI, or making rollback-by-down-migration
  the normal recovery model.
- Importing standalone Git histories, generated output, credentials, obsolete
  workflow entry points, or standalone decision maps.
- Automatically publishing or deploying from pull requests, merges, pushes, or
  tags.

## Authoritative decisions and prerequisites

The design is fixed by:

- [Choose the backend module boundaries and dependency graph](https://github.com/chauhaidang/xq-harness/issues/33)
- [Choose the source-history and import-curation policy](https://github.com/chauhaidang/xq-harness/issues/34)
- [Prove the write-service monorepo toolchain contract](https://github.com/chauhaidang/xq-harness/issues/35)
- [Choose the xq_fitness schema and migration authority](https://github.com/chauhaidang/xq-harness/issues/36)
- [Choose the xq-records lifecycle and production role](https://github.com/chauhaidang/xq-harness/issues/37)
- [Design monorepo CI/CD for DigitalOcean and Neon](https://github.com/chauhaidang/xq-harness/issues/38)
- [Define the API and mobile gateway compatibility contract](https://github.com/chauhaidang/xq-harness/issues/39)
- [Define secrets, rollout, rollback, and repository retirement gates](https://github.com/chauhaidang/xq-harness/issues/40)

Four prerequisite tickets govern import acceptance and production cutover:

| Prerequisite | Required evidence | Dependency |
| --- | --- | --- |
| [Publish xq-harness-test-utils for write-service onboarding](https://github.com/chauhaidang/xq-harness/issues/41) | An immutable `@chauhaidang/xq-harness-test-utils` release installs under Node 22/npm 11 using package credentials, not a file dependency. | None |
| [Release npm-compatible xq-harness-test-infra for integration](https://github.com/chauhaidang/xq-harness/issues/42) | A corrected published `@chauhaidang/xq-harness-test-infra` removes the invalid `portal:../xq-common-kit` dependency; its exact CLI version is recorded. | None |
| [Choose the write-service dependency-audit baseline](https://github.com/chauhaidang/xq-harness/issues/44) | Production and development findings are separated; required fixes and any time-bounded exceptions have owners and expiry dates. | None |
| [Re-run the write-service image and component acceptance matrix](https://github.com/chauhaidang/xq-harness/issues/43) | A clean Node 22 image and the full component suite pass against exact published `xq-infra` and immutable database/service images. | The two package-release prerequisites above |
| [Approve replacement XQ Fitness backend source snapshot](https://github.com/chauhaidang/xq-harness/issues/61) | A deterministic archive from three pinned standalone commits passes refreshed audit, build, image, and component gates bound to its new checksum. | The four historical prerequisite evidence sets above |

Recorded package-release evidence:

| Package | Release | Tarball SHA-1 | Publish evidence | Clean Node 22 consumer evidence |
| --- | --- | --- | --- | --- |
| `@chauhaidang/xq-harness-test-utils` | `0.1.1` | `32888639ae58798891d47f0ac7adcee7699dc940` | [GitHub Actions run 29930448510](https://github.com/chauhaidang/xq-harness/actions/runs/29930448510) | [GitHub Actions run 29930991976](https://github.com/chauhaidang/xq-harness/actions/runs/29930991976) |
| `@chauhaidang/xq-harness-test-infra` (`xq-infra`) | `0.1.2` | `7eac12c279fa737f35fce643bc8f3f84035fcc92` | [GitHub Actions run 29926867060](https://github.com/chauhaidang/xq-harness/actions/runs/29926867060) | [GitHub Actions run 29927207258](https://github.com/chauhaidang/xq-harness/actions/runs/29927207258) |

Historical write-service acceptance evidence (2026-07-22), bound to the deleted
archive and retained as prior evidence rather than replacement acceptance:

| Gate | Evidence |
| --- | --- |
| Toolchain | Node `22.15.0`; npm `11.16.0`; exact package tarballs above plus `@chauhaidang/xq-harness-common-kit@0.1.0` SHA-1 `3d3817768521562add1d00e7e7adf64cce38ac68` |
| Archived contract | Archive SHA-256 `1994859408762f3e188dc466fb31ee05b1c8b63cf0a4f1a88a8e849a97e26a38`; 20 OpenAPI operations |
| Service gates | Build, lint, generated CommonJS/ESM client build, and 9 unit suites / 153 tests passed |
| Immutable local images | `xq-fitness-db:acceptance-199485940876` image ID `sha256:6e0409b20581da97dcdff4a1e44d92b3fa1b89b7ed02b8fd03e93ac997dd40b7`; `xq-fitness-write-service:acceptance-199485940876` image ID `sha256:80754c0a17f9e749056555bb13031eda99dc0dfe2f5211c07b139cfdca7743df` |
| Component matrix | Exact `xq-infra@0.1.2` generated and started the matrix with `--no-pull`; all 9 suites / 44 tests passed; teardown left no running containers |

The four historical prerequisites are closed. Replacement gate #61 refreshed
the source-sensitive evidence against the new archive on 2026-07-23; its
sanitized manifest is
`docs/migrations/evidence/xq-fitness-replacement-snapshot-2026-07-23.md`.
Production cutover and standalone retirement retain their later execution
gates.

Replacement acceptance used Node `22.15.0`, npm `11.16.0`, the exact package
tarballs above, and archive SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`.
Both audit scopes contained zero findings. Build, lint, CommonJS/ESM client
generation, 153 unit tests, 20 OpenAPI operations, and 44 component tests
passed. The database image ID was
`sha256:b050944a0994068b83f467ac5bd1defa63588a09df68f35b5201e0aad88fe07a`;
the service image ID was
`sha256:369958bb50fb09d16737a9d483c3f4d8471e9226d3f80a1b8c423b644ead43dc`;
teardown completed. The development-only `xq-infra@0.1.2 -> uuid@9.0.1`
deprecation is owned by #58 through 2026-10-20.

### Execution ticket index

| Slice | Execution ticket |
| ---: | --- |
| 0 | [Publish xq-harness-test-utils for write-service onboarding](https://github.com/chauhaidang/xq-harness/issues/41), [Release npm-compatible xq-harness-test-infra for integration](https://github.com/chauhaidang/xq-harness/issues/42), [Choose the write-service dependency-audit baseline](https://github.com/chauhaidang/xq-harness/issues/44), and [Re-run the write-service image and component acceptance matrix](https://github.com/chauhaidang/xq-harness/issues/43) |
| 0r | [Approve replacement XQ Fitness backend source snapshot](https://github.com/chauhaidang/xq-harness/issues/61) |
| 1 | [Curate and register the XQ Fitness backend modules](https://github.com/chauhaidang/xq-harness/issues/46) |
| 1a | [Capture read-only XQ Fitness production preflight](https://github.com/chauhaidang/xq-harness/issues/60) |
| 2 | [Build the verified xq_fitness Prisma baseline](https://github.com/chauhaidang/xq-harness/issues/47) |
| 3 | [Reconcile the live xq-records Prisma contract](https://github.com/chauhaidang/xq-harness/issues/48) |
| 4 | [Onboard the write-service compatibility tracer bullet](https://github.com/chauhaidang/xq-harness/issues/49) |
| 5 | [Add module CI and manual CD workflows for the XQ Fitness backend](https://github.com/chauhaidang/xq-harness/issues/50) |
| 6 | [Configure isolated XQ Fitness deployment environments](https://github.com/chauhaidang/xq-harness/issues/51) |
| 7 | [Publish immutable backend releases and reconcile both Neon databases](https://github.com/chauhaidang/xq-harness/issues/52) |
| 8 | [Cut over the XQ Fitness write service on DigitalOcean](https://github.com/chauhaidang/xq-harness/issues/53) |
| 9 | [Observe and accept the XQ Fitness backend cutover](https://github.com/chauhaidang/xq-harness/issues/54) |
| 10 | [Retire the standalone XQ Fitness backend repositories](https://github.com/chauhaidang/xq-harness/issues/55) |
| Follow-up | [Remove deprecated XQ Fitness write-service development dependencies](https://github.com/chauhaidang/xq-harness/issues/58), after #49 and by 2026-10-20 |

## Provenance and curated import

### Snapshot identity

| Item | Value |
| --- | --- |
| Archive | `xq-fitness-backend-source-2026-07-23.tar.gz` |
| SHA-256 | `3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5` |
| Archive roots | `write-service/`, `database/`, `xq-records/` |
| Write-service source | [`chauhaidang/xq-fitness-write@49ebb1baa58c377b6e8281463db491d077ab086b`](https://github.com/chauhaidang/xq-fitness-write/commit/49ebb1baa58c377b6e8281463db491d077ab086b) |
| Fitness database source | [`chauhaidang/xq-fitness-db@450f6b6157f622dc3f6a98fdaa52953ce4c88ae3`](https://github.com/chauhaidang/xq-fitness-db/commit/450f6b6157f622dc3f6a98fdaa52953ce4c88ae3) |
| Records database source | [`chauhaidang/xq-records@d9acc0fa21b16968c6cdf196c5e1ad63ff9a809b`](https://github.com/chauhaidang/xq-records/commit/d9acc0fa21b16968c6cdf196c5e1ad63ff9a809b) |
| Deterministic assembly | 208 entries; fixed `2026-07-20T23:59:59Z` metadata; normalized owners; sorted paths; gzip without timestamp; repeat SHA matched |
| Monorepo import date and commit | 2026-07-23, commit `c39cf5d`. See `docs/migrations/evidence/xq-fitness-curated-import-2026-07-23.md`. |

The original approved archive was deleted by the operator and could not be
recovered. On 2026-07-23 the operator approved replacing it with a deterministic
snapshot of the exact standalone heads above. Each commit was already the latest
at the original 2026-07-20 cutoff and remained the current head when pinned.
GitHub commit tarballs were normalized into the three approved roots without Git
history. The original repositories retain pre-monorepo history.

The replacement archive remains untracked in an ignored local location. Gate
#61 owns commit pinning, deterministic assembly, and refreshed source-sensitive
acceptance. It closed before #46 consumed the explicit local archive path. The
curated import verified the fixed SHA-256 before extraction and records its
disposition in
`docs/migrations/evidence/xq-fitness-curated-import-2026-07-23.md`. Missing
input, checksum/root mismatch, or an open #61 remains a STOP for any repeat
import.

### Source mapping

| Archive source | Destination | Curated disposition |
| --- | --- | --- |
| `write-service/src/` | `modules/xq-fitness-write-service/src/` | Import runtime source without behavioral refactoring. |
| `write-service/api/write-service-api.yaml` | `modules/xq-fitness-write-service/api/write-service-api.yaml` | Import unchanged as the canonical v1 specification; preserve `info.version` `3.0.1` and every `operationId`. |
| `write-service/test/unit/`, `test/component/`, component gateway configuration, Jest/TypeScript/lint/format configuration | Corresponding write-service module paths | Import tests and source configuration; replace artifact and package assumptions with monorepo/published-release conventions. |
| `write-service/Dockerfile`, `.dockerignore`, `test-env/`, `nginx-gateway.conf`, `xq-compose.yml`, useful operational scripts | Corresponding write-service module paths | Import only inputs needed to reproduce the image and pinned component environment; move both Docker stages to Node 22. |
| `write-service/.do/app.yaml`, `.github/`, `.agents/`, `.cursor/` | Root workflow/agent conventions and module documentation | Treat as design inputs. Translate approved behavior, then omit the inactive nested originals. The archived full app template must not become the production deployment mechanism. |
| `write-service/.env.example` | Sanitized module `.env.example` | Correct stale `DATABASE_*` names to runtime `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_SSL`; use placeholders/local-only values and no credential. |
| `database/schemas/`, `database/migrations/`, `database/prisma/` | `modules/xq-fitness-db/prisma/` plus a non-executable legacy-history location | Reconcile into one Prisma baseline and an introspected contract. Preserve legacy SQL as documentation, never as a replay path. |
| `database/tests/`, `Dockerfile`, `test-env/`, package and Prisma configuration, applicable scripts/docs | Corresponding fitness-database module paths | Import and adapt to the baseline, disposable PostgreSQL, restricted-role, image, and package contracts below. |
| `database/.github/`, `.agent/`, `AGENTS.md` | Root workflows/agent conventions and module documentation | Translate useful behavior and omit inactive nested copies. |
| `xq-records/prisma/` | `modules/xq-records/prisma/` | Import the existing Prisma schema and append-only migration history; live reconciliation is required before release. |
| `xq-records/tests/`, `docker-init/`, `Dockerfile`, `test-env/`, package/Prisma configuration, applicable scripts/docs | Corresponding records module paths | Import and adapt to PostgreSQL 18, restricted-role, fresh migration, and image gates. |
| `xq-records/.github/` | Root workflows and module documentation | Translate the single-action migration release; omit inactive nested workflows and legacy role-management modes. |
| `xq-records/.env.example` | Sanitized module `.env.example` | Keep canonical local/development names only and placeholders, never a live URL or password. |

Correct the archived `xq-records/package.json` repository URL from the stale
`xq-records-db.git` metadata to the monorepo module/repository metadata. Rewrite
all module READMEs for `./scripts/module`, monorepo paths, independent releases,
and this manifest. Each README links back here.

### Exclusions

Do not import:

- `test/**/tsr/`, JUnit XML, HTML/Markdown reports, coverage, build output,
  generated Prisma clients, or generated OpenAPI clients;
- the standalone `write-service/.npmrc`, `.env` files, credentials, registry
  tokens, rendered app specs, or caches;
- inactive nested `.github`, `.agent`, `.agents`, and `.cursor` files after their
  useful behavior is translated;
- standalone decision maps, report-generation examples, downloaded shared
  scripts, or documentation whose assumptions conflict with this specification;
- legacy fitness SQL as executable Docker initialization or production CD entry
  points.

Generation commands must recreate every excluded generated artifact from a
clean checkout. Any uncertain file is reviewed explicitly during import; it is
not retained merely because it exists in the archive.

## Module and interface design

No relevant existing root or target-module `CONTEXT.md` or ADR was present when
this specification was authored. These approved boundaries must be restated in
module documentation or ADRs during import without changing their substance.

### Dependency direction

```text
mobile Axios adapter -> public v1 gateway -> xq-fitness-write-service -> xq_fitness
                                              (raw pg)                 (Neon)

write-service component tests -> exact published xq-infra CLI
                              -> immutable xq-fitness-db image digest

xq-records -> its own Neon database (no runtime consumer yet)
```

There are no local `modules.yaml` `depends_on` edges between the three new
modules, or from the write service to `xq-test-infra`. Cross-module validation
consumes released, exact artifacts, except for the explicitly bounded
pre-release OCI handoff below. This keeps release cadence, production
credentials, migration authority, and failure containment independent.

### Pre-release database image handoff

The final #49 component gate needs the database image before production release
#52, so #47 transfers an immutable CI candidate without publishing it:

1. #47 adds the initial path-scoped `xq-fitness-db-ci.yml` caller. It has no
   package-write or production permission and builds the database with an OCI
   layout output, never a registry push.
2. The producing run uploads a protected 30-day artifact named from the source
   commit. It contains the OCI archive plus a sanitized provenance manifest with
   source commit, module version, Dockerfile and lock/migration-tree hashes,
   resolved base-image digests, OCI manifest digest, archive SHA-256, producing
   workflow/run ID, capture time, and expiry time. The upload-artifact digest is
   recorded separately in the run summary and ticket evidence.
3. #49 accepts an explicit producing run ID, artifact name, upload digest,
   archive SHA-256, and OCI manifest digest. Its initial path-scoped CI caller
   downloads that exact artifact with read-only Actions access, verifies every
   identity before loading it, and runs the full component/mobile gate against
   the verified digest. It never builds from the sibling module source.
4. #52 promotes the exact verified OCI archive to GHCR through a manual,
   protected, digest-preserving copy and verifies the registry digest. If the
   candidate expired or any identity differs, rerun #47 from the same reviewed
   commit and rerun #49's final gate against the replacement artifact before
   publication. Silent rebuild or substitution is forbidden.

The tracer tickets own their initial path-scoped CI callers because those
callers produce and consume acceptance evidence. #50 later reviews and hardens
all three CI callers and adds the three manual-only CD entry points. This is not
a local module dependency or a production release: GitHub Actions storage is a
bounded evidence transport, and GHCR receives no image before #52 approval.

### `xq-fitness-write-service`

**Owns:** Express runtime, raw-`pg` data access, canonical OpenAPI document,
component-client generation, service container, DigitalOcean component update,
public v1 compatibility tests, and post-deploy service/gateway smoke checks.

**Inputs:** Node 22/npm 11; exact published test utility and `xq-infra` versions;
an immutable `xq-fitness-db` GHCR image version or digest for integration; six
runtime `DB_*` values supplied by DigitalOcean.

**Outputs:** an immutable semantic-versioned service image and digest; a
sanitized release/deployment report; an unpublished generated TypeScript client
used only by component tests. Generated CJS/ESM clients are ignored and never
hand-edited.

**Version boundary:** curated import records the archived service package at
`2.1.0` so source provenance is exact. The compatibility tracer bullet then
sets the module/package release version to `3.0.0`, which is the first
monorepo-owned write-service release and must not be published before all #49
acceptance gates pass. OpenAPI `info.version` remains independently fixed at
`3.0.1`; neither import nor the service-version bump changes the public API
contract.

**Does not own:** database migration, database roles, the mobile adapter, a
shared client package, or the downstream `xq-contracts` catalog. A catalog
mirror, if retained, is a separately reviewed downstream pull request and is
never auto-merged.

The clean-install contract bootstraps deterministic client generation before
project installation, then performs `npm ci`. Build and CI must prove the client
compiles in CJS and ESM modes without leaving a dirty tracked tree.

### `xq-fitness-db`

**Owns:** the `xq_fitness` schema contract, ordered Prisma migration ledger,
handwritten reviewed PostgreSQL migration SQL, stable reference seed, restricted
role verification, local/integration image, existing
`@chauhaidang/xq-fitness-db-client` package, Neon migration workflow, and data
invariant checks.

**Outputs:** one semantic schema release tying together a versioned GHCR image
and digest, the versioned Prisma client package, checked-in migrations, commit,
and deployment report. Consumers pin immutable releases; `latest` is forbidden
in integration and release workflows.

**Does not own:** write-service runtime queries or deployment, the records
database, automatic production seeding, or owner/role administration in normal
CD.

#### Hybrid SQL/Prisma baseline

Handwritten reviewed PostgreSQL is authoritative for schema changes. Prisma
Migrate owns directory ordering, checksums, deployment tracking, locking, and
execution. Migration SQL lives in timestamped
`prisma/migrations/<timestamp>_<name>/migration.sql` directories.

1. Take a sanitized schema-only snapshot of live Neon and inventory its Prisma
   ledger; do not copy row contents.
2. Reconcile that snapshot with `schemas/schema.sql`, the duplicate `003`
   scripts, later corrective SQL, constraints/triggers, and the checked-in
   `schema.prisma`.
3. Create
   `prisma/migrations/00000000000000_baseline/migration.sql` representing the
   verified current live schema. Move legacy source SQL into non-executable
   migration-history documentation.
4. Apply the baseline plus any later migrations to fresh disposable PostgreSQL.
   Compare its schema with the live schema-only snapshot and checked-in Prisma
   contract. Unexpected drift is a stop condition.
5. Only after schema equivalence and a verified Neon recovery point, run
   `prisma migrate resolve --applied 00000000000000_baseline` against production.
   Never execute the baseline SQL against the existing database.

For every later change: author reviewed SQL in a new migration, apply it to a
disposable database, run `prisma db pull`, review and commit `schema.prisma`,
then validate, generate, test, and compare drift. Shared/CI/production databases
use `prisma migrate deploy`; production never uses `prisma db push` or
`prisma migrate dev`. Applied migrations are immutable.

Seeds are separate, rerunnable, deterministic inserts/upserts of stable
reference data only. They contain no user, workout, snapshot, or operational
records. Local/test may seed after migration; production seeding is a separate,
explicitly approved operation.

### `xq-records`

**Owns:** the independent, live multi-domain records schema, existing Prisma
migration ledger, restricted-role behavior, local/integration image, Neon
migration workflow, and object-history invariants.

**Inputs/outputs:** `schema.prisma` is the authoritative logical schema and its
checked-in Prisma migrations are authoritative deployment history. A semantic
release publishes a versioned GHCR PostgreSQL image/digest and deploys those
same migrations from the tagged commit. It publishes no client package.

**Does not own:** a runtime service, consumer domain validation/workflows,
`xq_fitness`, a shared production runtime role, or row-level-security policy
before tenancy and consumer requirements exist. Neon may scale to zero while
there are no consumers.

Preserve the live database, endpoint, data, and `_prisma_migrations` ledger.
Before the first monorepo release, compare the live schema, data presence, and
ledger with the archive. Baseline only after an explicit schema diff and
recoverability check if the ledger is missing or invalid. Create migrations
with `prisma migrate dev` only on disposable development databases; shared, CI,
and production environments use `prisma migrate deploy`. Custom reviewed SQL
may augment generated migrations for database features Prisma cannot express.

`object_versions` is append-only. Creating a version and updating
`current_version_id` is atomic. Supported states remain `active`, `archived`,
and `deleted`; `deleted` is soft deletion. Runtime roles cannot routinely hard
delete objects/history. Physical purge requires an audited administrative
retention procedure.

Every future consumer requires an approved contract identifying ownership,
namespaced object types, `external_key` and `origin_source` semantics, JSON
compatibility, retention/deletion, query/index needs, and isolation tests. It
receives a dedicated restricted role, not owner credentials or a permanent
shared `xq_records_app_user` identity.

## API and mobile compatibility contract

The canonical file is
`modules/xq-fitness-write-service/api/write-service-api.yaml`. The imported
contract version stays `3.0.1`; moving repositories is not an API release. The
following 20 method/path/`operationId` tuples are mandatory gates:

| # | Operation | Stable `operationId` |
| ---: | --- | --- |
| 1 | `GET /muscle-groups` | `getMuscleGroups` |
| 2 | `GET /routines` | `getRoutines` |
| 3 | `POST /routines` | `createRoutine` |
| 4 | `GET /routines/{routineId}` | `getRoutineById` |
| 5 | `PUT /routines/{routineId}` | `updateRoutine` |
| 6 | `DELETE /routines/{routineId}` | `deleteRoutine` |
| 7 | `POST /workout-days` | `createWorkoutDay` |
| 8 | `PUT /workout-days/{dayId}` | `updateWorkoutDay` |
| 9 | `DELETE /workout-days/{dayId}` | `deleteWorkoutDay` |
| 10 | `GET /exercises` | `getExercises` |
| 11 | `POST /exercises` | `createExercise` |
| 12 | `GET /exercises/{exerciseId}` | `getExercise` |
| 13 | `PUT /exercises/{exerciseId}` | `updateExercise` |
| 14 | `DELETE /exercises/{exerciseId}` | `deleteExercise` |
| 15 | `POST /workout-day-sets` | `createWorkoutDaySet` |
| 16 | `PUT /workout-day-sets/{setId}` | `updateWorkoutDaySet` |
| 17 | `DELETE /workout-day-sets/{setId}` | `deleteWorkoutDaySet` |
| 18 | `GET /routines/{routineId}/days` | `getWorkoutDays` |
| 19 | `GET /routines/{routineId}/weekly-report` | `getWeeklyReport` |
| 20 | `POST /routines/{routineId}/snapshots` | `createWeeklySnapshot` |

For every row, semantic comparison and generated-client component coverage must
preserve path/query parameter names and meaning, request/response JSON names and
types, status codes, nullability, collection shapes, and empty-body behavior.
Spec and Express routes change together. In particular, preserve the
`PUT /workout-day-sets/{setId}` fallback using paired `workoutDayId` and
`muscleGroupId` query parameters.

Preserve:

- external base path `/xq-fitness-write-service/api/v1`, gateway removal of
  `/xq-fitness-write-service`, internal Express base `/api/v1`, container port
  `3000`, external `/xq-fitness-write-service/health`, and internal `/health`;
- lightweight `/health` HTTP 200 response with `status`, `service`, and an
  ISO-8601 `timestamp`, with no mandatory database query;
- JSON errors `{ code, message, timestamp, details? }`, human-readable
  `message`, optional string-array `details`, stable codes `VALIDATION_ERROR`,
  `BAD_REQUEST`, `DUPLICATE_ERROR`, `NOT_FOUND`, and `INTERNAL_ERROR`, and the
  same unknown-route 404 envelope;
- 201 creates, 200 reads/updates/create-or-update responses, and empty 204
  deletes.

Additive optional fields/operations are permitted after import. Removal,
renaming, retyping, tightened requiredness, changed null/empty behavior, or
changed meaning is breaking. New enum members require generated-client and
mobile tests. Patch contract versions cover non-behavioral corrections, minor
versions backward-compatible additions, and major versions breaking behavior.
A break requires a new path such as `/xq-fitness-write-service/api/v2`; v1 and
v2 run together until all supported mobile versions migrate and their approved
observation window completes.

CI validates/lints OpenAPI, diffs it against the latest released spec, proves
route/spec bidirectional coverage, regenerates/compiles CJS and ESM clients,
asserts status/error behavior, and runs gateway components against pinned
released artifacts. The existing mobile Axios adapter then exercises routine,
workout day/set, exercise, snapshot, weekly report, and surfaced-error workflows
through the real external path. CD requires public `/health` plus a safe
read-only v1 database-backed request; reports contain no response data.

## CI/CD design

### Workflow entry points

| Workflow | Trigger and production authority | Required gates/actions |
| --- | --- | --- |
| `xq-fitness-write-service-ci.yml` | Automatic, path-scoped; no production secrets or publish permission | Node 22/npm 11 clean install; deterministic OpenAPI generation and clean-tree check; build; lint; unit and API contract tests; CJS/ESM client compilation; dependency-audit policy; Docker build; component and mobile compatibility tests using exact `xq-infra` and `xq-fitness-db` releases. |
| `xq-fitness-write-service-cd.yml` | Manual `workflow_dispatch` only; protected `xq-fitness-write-service-production` | Re-run release verification; publish/reuse an immutable GHCR image; record digest; schema compatibility preflight; patch only the DigitalOcean component digest; provider, health, gateway, and safe-read smoke checks. Never migrate a database. |
| `xq-fitness-db-ci.yml` | Automatic, path-scoped; no Neon access or publish permission | Prisma validate/generate; fresh baseline/all migrations; drift; seed idempotency; restricted-role, smoke, compatibility, Docker-build, and Prisma-package dry-run gates. |
| `xq-fitness-db-cd.yml` | Manual `workflow_dispatch` only; protected `xq-fitness-db-production` | Reverify; publish/reuse versioned GHCR image and existing Prisma client package from the same release; preflight and run only `prisma migrate deploy` against fitness Neon; post-check ledger/schema/permissions/data invariants. |
| `xq-records-ci.yml` | Automatic, path-scoped; no Neon access or publish permission | Prisma validate/generate; migrate from zero on fresh PostgreSQL 18; history-integrity, restricted-role, drift, smoke, and Docker-build gates; N/N-1 consumer tests when consumers exist. |
| `xq-records-cd.yml` | Manual `workflow_dispatch` only; protected `xq-records-production` | Reverify; publish/reuse versioned GHCR image; preflight and run only `prisma migrate deploy` against records Neon; post-check ledger/schema/permissions/history invariants. No npm client. |

Root reusable workflows may implement common mechanics, but these six explicit
entry points own independent status, permissions, concurrency, and history. CI
cancels superseded runs for the same pull request/module. CD never cancels an
in-progress deployment; each production environment has its own concurrency
lock, and Prisma migration locking remains enabled per database.

Every CD dispatch requires an explicit Git ref, semantic version, and typed
confirmation. Before approval it displays ref, version, commit, artifact digest,
target, and migration/deployment plan. A version already associated with
different content fails; an identical rerun may only verify and reuse the same
artifact. Publication and mutation begin only after protected-environment
approval. Retry only classified transient provider/connection failures;
validation and logical migration failures stop without automatic retry.

Every CD run creates a GitHub deployment record and sanitized release report
containing version, commit, actor/approver, artifact digests, target, migrations
or provider deployment IDs, checks, timestamps, final status, and previous
known-good release. Detailed logs are short-retention workflow artifacts, not
GitHub Pages.

### DigitalOcean digest-only update

The write-service CD does not render the archived app template. It:

1. Fetches the live app spec by immutable app ID and asserts exactly one
   component named `write-service`.
2. Captures the previous component digest and deployment ID.
3. Changes only that component's GHCR image digest to the published digest.
4. Produces a sanitized, allowlisted diff and fails if any other field differs,
   including routes, environment values, encrypted secrets, scaling, health
   configuration, or other components.
5. Validates the complete spec, applies it, waits for provider health, checks
   `/health`, and performs a safe read-only v1 request through the public
   gateway.
6. Records previous/new digests and deployment IDs without rendering secrets.

The app ID, app name, and component name are non-secret environment variables.
The GHCR read credential and all runtime database settings remain encrypted in
DigitalOcean and pass through untouched.

### Isolated Neon migration streams

Each database CD accepts only the direct migration credential for its own Neon
database and exposes one mutation: `prisma migrate deploy` from the selected
immutable release commit. Neither workflow can select the other database. The
write-service workflow receives neither migration URL.

Remove legacy modes for replaying one/all SQL files, applying raw schema, fresh
production setup, automatic production seed, or role mutation. Role
administration and explicit production seed are separately approved operational
procedures. Database workflows do not trigger each other or the service. An
operator coordinates expansion, compatible service deployment, backfill and
validation, observation, and later contraction as separate releases.

## Secret and environment ownership

This table names secrets but never their values:

| Location/owner | Secret or variable | Permitted use |
| --- | --- | --- |
| GitHub environment `xq-fitness-write-service-production` | Secret `DO_TOKEN`; non-secret immutable app ID, app name, and service name | Read, validate, and patch only the live DigitalOcean app component. |
| Write-service GitHub workflow | Scoped `GITHUB_TOKEN` | Publish the release image to GHCR when repository-token permissions suffice. No general package PAT. |
| DigitalOcean encrypted app settings | GHCR read-only credential; `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` | Pull the image and connect the runtime service. These values never transit GitHub app-spec rendering. |
| GitHub environment `xq-fitness-db-production` | `XQ_FITNESS_MIGRATION_DATABASE_URL` | Direct Prisma migration connection using a schema-change role distinct from runtime/owner roles. |
| GitHub environment `xq-records-production` | `XQ_RECORDS_MIGRATION_DATABASE_URL` | Direct Prisma migration connection using a schema-change role. No consumer credential exists yet. |
| Dedicated catalog-sync job, only if retained | Least-privilege cross-repository token | Open a versioned mirror PR in `xq-contracts`; never auto-merge. |
| Separately approved administration | Owner/admin, role rotation, and production seed credentials | Exceptional administration only; excluded from normal CD. |
| Future consumer-owned environment | One consumer-specific restricted records role and secret | Approved runtime access after the consumer contract and permission tests pass. |

CI receives no DigitalOcean or production Neon secrets. Mask connection strings,
passwords, tokens, and registry credentials; never place them in outputs,
rendered specs, reports, caches, or artifacts. Registry authentication comes
from user configuration or scoped workflow tokens, not imported `.npmrc` files.

## Compatibility, recovery, and failure handling

Both schemas evolve with expand-and-contract and remain compatible with service
versions N and N-1. Do not rename/drop columns, narrow types, tighten nullability,
or change meaning in one release. Risky migrations document preflight checks,
recovery, backfill, and their compatibility window. Database issues are
forward-fixed with a new migration; applied migrations are never edited.

Roll the DigitalOcean service back to its recorded previous successful
deployment when provider deployment, health, public gateway, critical mobile
workflow checks, or material post-deploy 5xx/latency checks fail. Leave the
database forward because it must support N-1. A failed Prisma deployment stops;
resume the identical immutable migration only after a proven transient failure,
or publish a reviewed forward fix after a logical failure.

### Cutover health and rollback thresholds

Use the same versioned synthetic probe suite immediately before and after
cutover. A probe round contains at least 20 HTTP observations spanning public
health, a safe database-backed read, the representative mobile compatibility
workflow, and the stable-error contract. Establish the pre-cutover latency
baseline with at least 10 successful rounds over 30 minutes against the current
production image. Record the suite commit, target digest, request mix, round
timestamps, sample count, error count, and p50/p95 latency without response
data.

After the digest change, run one round every two minutes for 30 minutes. Roll
back the application to the recorded previous successful deployment when any of
these occurs:

- any contract, data-integrity, permission, running-digest, provider-health, or
  required-workflow check fails;
- a required synthetic probe returns 5xx twice consecutively; or
- per-round p95 latency exceeds both two times the recorded baseline p95 and
  1,000 milliseconds for three consecutive rounds.

An isolated transport/provider failure receives one retry after 30 seconds.
Failure of that retry counts as the next consecutive failure; no further
automatic retry is allowed. The same thresholds remain active throughout the
14-day observation window. Threshold breach stops acceptance and invokes the
application rollback/incident procedure; compatible database state stays
forward. Low traffic never waives the synthetic rounds or changes a threshold.
During observation, run at least one three-round sequence at the same two-minute
cadence per UTC calendar day and retain continuous provider metrics when
available. Exercise the representative mobile lifecycle at the start, after
each of at least two weekly snapshot/report boundaries, and at the end of the
window. The 14-day clock starts only after the immediate 30-minute validation
finishes successfully.

Use Neon point-in-time recovery only for confirmed destructive corruption or
operator error when a data-preserving forward fix is unsafe. It requires human
approval, an independently rehearsed procedure, a verified restore window or
recovery branch, and full ledger/schema/data/permission validation afterward.

## Production rollout and validation

### Pre-cutover inventory

The read-only production preflight first captures sanitized evidence for both
databases: PostgreSQL and Prisma versions/status; migration names/checksums;
schema objects; roles and grants; restore window/recovery point; and table row
counts without row data. It also captures the DigitalOcean app/component
identity, live digest, route, encrypted-setting names, deployment ID, and
previous known-good release. Before any later mutation, the environment-
readiness and release slices refresh that evidence and stop if it no longer
matches the reviewed preflight baseline.

For `xq_fitness`, validate routine/day/set/exercise relationships, snapshot
relationships, and safe read-only weekly-report behavior. For `xq-records`,
validate object-type/object/version relationships, unique version sequences,
valid `current_version_id` pointers, supported status values, and history
integrity. Repeat the same queries after each applicable mutation and compare
sanitized counts/invariants.

Unexpected destructive schema differences, row-count loss, new orphans,
permission broadening, invalid history pointers, or ledger divergence is an
immediate stop. No later rollout step may compensate for failed evidence.

### Cutover sequence

1. Land curated modules, provenance, documentation/ADRs, CI, and manual-only CD
   without production credentials or mutation.
2. Close all four historical prerequisites plus replacement-snapshot gate #61,
   then pass all three module CI contracts from a clean checkout.
3. Configure and test the three protected production environments, proving each
   can reach only its assigned provider/database.
4. Manually publish immutable semantic releases and record commits, versions,
   package/image digests, and previous known-good releases.
5. Reconcile live Prisma ledgers. Mark only the verified fitness baseline
   applied; replay no legacy SQL and recreate no database.
6. Deploy backward-compatible database expansions independently. Verify ledger,
   schema, permissions, counts, and invariants after each database.
7. Patch only the DigitalOcean `write-service` component digest.
8. Verify provider health, external `/xq-fitness-write-service/health`, a safe
   read-only v1 operation, and representative mobile workflows.
9. Observe for at least 14 calendar days and more than one weekly
   snapshot/report boundary before schema contraction or repository retirement.

No duplicate production app is required. Low traffic does not shorten the
window; explicitly exercise at least one representative mobile lifecycle and
one weekly snapshot/report cycle. During observation, standalone workflows are
disabled from mutation but their repositories and immutable artifacts remain
available for investigation/recovery.

Cutover is accepted only when all three monorepo modules are the documented
source of truth; clean-checkout CI/manual CD is reproducible; both Neon databases
pass ledger/schema/permission/data checks; DigitalOcean runs the recorded digest
with only the intended app-spec field changed; the external v1/mobile contract
passes; and recovery procedures/previous versions have named owners.

### Standalone retirement

Freeze standalone repositories at cutover and disable their publish, migration,
and deployment mutation paths. After the 14-day acceptance gate, point their
descriptions/settings to the monorepo modules, remove mutation-capable branch and
webhook integrations, verify replacements, then revoke standalone secrets,
deploy keys, PATs, and provider tokens and archive the repositories read-only.
Rotate DigitalOcean, Neon migration/runtime, GHCR-read, and cross-repository
credentials where practical.

Retirement follows an evidence-bound, one-way sequence:

1. After #54 acceptance, commit a sanitized retirement manifest under
   `docs/migrations/evidence/`. It records each standalone repository URL, final
   default-branch commit, archive state, releases/tags, GHCR/npm artifact
   identities and digests, mutation surface, monorepo replacement, credential
   name/ID (never value), accountable owner, recovery custodian, and verification
   timestamp. At least two named repository/release custodians must confirm they
   can read every retained recovery source.
2. Disable standalone workflows, branch mutation paths, deploy hooks, and
   webhooks while leaving repositories unarchived and credentials intact.
3. Run monorepo CI/CD verify-only paths plus production health, integrity,
   permission, gateway/mobile, and artifact-access checks. Do not continue if a
   replacement is incomplete.
4. Revoke or rotate one standalone credential/integration at a time. Immediately
   repeat its mapped replacement and production checks, record the sanitized
   result, and stop before the next revocation on failure. Do not silently
   re-enable standalone mutation; use the incident/recovery process.
5. Update descriptions/settings to the monorepo locations, archive all three
   repositories read-only, and repeat the full verification suite.

Preserve existing issues, releases, histories, GHCR images, and npm packages.
Do not delete the standalone repositories, the live app, either Neon database,
public gateway, production data, or old artifacts. Further cleanup needs a
separate approved retention decision. Until then, retained repositories and
immutable artifacts have no automatic expiry or deletion action.

## Implementation slices and gates

Owners below are accountable roles, not authorization to bypass protected
environment approval.

| Slice | Owner(s) | Depends on | Deliverable and acceptance criteria | Verification | Stop/go gate |
| ---: | --- | --- | --- | --- | --- |
| 0. Release prerequisites | Test-utils/test-infra maintainers; write-service owner; security reviewer | None; acceptance matrix waits for both package releases | Close the four linked prerequisite tickets with immutable versions, clean npm 11 installation evidence, approved audit disposition, and the full image/component matrix. | Ticket-specific clean install/audit/image/component commands; record exact versions and digests in the tickets and module lockfile/config. | **GO:** all four evidence sets approved. **STOP:** unpublished/local dependency, invalid npm graph, expired/unowned audit exception, or failed matrix. |
| 0r. Replacement snapshot acceptance | Migration owner; backend/database owners; SDET; security reviewer | Slice 0 historical evidence and three pinned source commits | Reproduce the replacement archive; rebind dependency audit, build, generated-client, unit, image, and full component evidence to its checksum; expose no secret or `.npmrc` content. | Repeat archive assembly/hash; Node 22/npm 11.16 audit and clean trees; build/lint/client/unit; local immutable images; exact `xq-infra` component matrix; teardown; `git diff --check` | **GO:** issue #61 closes with zero undispositioned findings and all source-sensitive gates passing. **STOP:** nondeterminism, source/provenance mismatch, secret exposure, advisory, unowned deprecation, or gate failure. |
| 1. Curated import and registration | Backend engineer for each module; solution designer reviews boundaries | Slices 0 and 0r plus verified replacement checksum | Import only mapped inputs; add three independent `modules.yaml` registrations and `version.yaml` files with no cross-module `depends_on`; correct metadata/env examples; translate workflows/agents/docs; link each README here; record import date/commit. No generated/report/secret files. | `./scripts/module list`; `./scripts/module info xq-fitness-write-service`; `./scripts/module info xq-fitness-db`; `./scripts/module info xq-records`; `python3 scripts/validate-module-versions.py`; `git diff --check` | **GO:** #61, checksum/source map, and clean registrations agree. **STOP:** open #61, provenance mismatch, secret/generated output, local dependency edge, or unresolved ADR conflict. |
| 1a. Read-only production preflight | Release operator; database owners; security reviewer | Slice 1 | Capture sanitized Neon and DigitalOcean facts, invariants, recovery evidence, and target identity in durable manifests; bind them by hash to short-lived protected raw evidence. Configure no environment or mutation credential. | Read-only provider/database inspection; invariant queries; sanitization-policy tests; secret scan; `git diff --check` | **GO:** #47/#48 receive current, unambiguous, reviewable evidence. **STOP:** missing access/recovery evidence, drift, ambiguous target, attempted mutation, or sensitive output. |
| 2. Fitness baseline tracer bullet | Fitness DB backend engineer; database reviewer; SDET | Slices 1 and 1a | Reconcile live evidence and legacy SQL; create the verified baseline; preserve legacy files as non-executable history; implement migration, drift, role, smoke, compatibility, image, and client dry-run tests. Add the initial path-scoped database CI caller and emit the protected, digest-bound OCI candidate for #49. No registry publication or production resolution. | `./scripts/module ci xq-fitness-db`; Prisma, drift, seed-twice, role and smoke tests; workflow-permission inspection; verify OCI/archive/upload digests and provenance; `git diff --check` | **GO:** disposable result, Prisma contract, sanitized live snapshot, and OCI evidence agree. **STOP:** drift, destructive difference, seed mutation, unverified recovery point, publish permission, mutable identity, or incomplete provenance. |
| 3. Records preservation tracer bullet | Records DB backend engineer; database reviewer; SDET | Slices 1 and 1a | Preserve schema/migrations; reconcile live evidence and ledger; add PostgreSQL 18 from-zero, history, role, drift, smoke, image gates, and the initial path-scoped records CI caller; remove normal-CD role modes; publish no client. | `./scripts/module ci xq-records`; Prisma, history/restricted-role, Docker, and CI-permission checks; `git diff --check` | **GO:** live state and checked-in history reconcile, or an explicit approved baseline plan exists. **STOP:** ledger divergence, lost data, broadened permissions, invalid current-version pointers, or invented consumer requirements. |
| 4. Write-service compatibility tracer bullet | Write-service backend engineer; SDET; mobile owner | Slices 0 and 1; exact OCI candidate from slice 2 for final component gate | Adapt Node 22/npm 11; preserve raw `pg`, 20 operations, gateway/health/errors; implement deterministic clients, semantic diff, route parity, unit, Docker, component/mobile gates, and the initial path-scoped service CI caller. Verify and consume the explicit OCI run/artifact identities without sibling source access. | `./scripts/module ci xq-fitness-write-service`; OpenAPI, client, build/lint/unit/contract/Docker/component/mobile checks; OCI-identity and CI-permission inspection; `git diff --check` | **GO:** all 20 operations and external mobile workflows pass against the exact candidate. **STOP:** identity/provenance mismatch, breaking diff, generated drift, unpinned dependency/image, image failure, or route/error/health change. |
| 5. Harden CI and add manual CD | Backend owners; release engineering; security reviewer | Slices 2–4 | Review and harden the three tracer-owned CI callers; add the three manual-only CD files with isolated permissions/environments/concurrency, immutable artifact reuse, sanitized reports, digest-only DO patch, and one-action Neon deploys. Prove PR/push/tag cannot invoke CD. | Workflow lint/tests; dry-run dispatch validation with no production secrets; CI runs for each module; inspect permissions, artifact handoff, and path filters; `git diff --check` | **GO:** CI identities remain exact and CD dry runs show exact targets with zero mutation before approval. **STOP:** automatic CD trigger, shared production credential, mutable tag, full app-spec rendering, cross-database access, or unmasked secret. |
| 6. Production environment readiness | Release operator; database owners; security reviewer | Slices 1a and 2–5 | Refresh and compare the preflight evidence; configure three protected environments; prove credential isolation; record previous known-good releases and named recovery owners. | Read-only DigitalOcean and Neon evidence refresh; environment/permission audit; restore-window/recovery rehearsal evidence. | **GO:** refreshed inventories reconcile and every environment reaches only its target. **STOP:** stale or divergent evidence, missing recovery point, ambiguous app component, credential crossover, permission broadening, or sensitive output. |
| 7. Immutable releases and database reconciliation | Release operator; database owners | Slice 6 | Manually promote the exact #47/#49-approved OCI candidate to GHCR with a digest-preserving copy, or regenerate from the same commit and rerun #49 if it expired; release the other modules; record commit/version/digests; resolve the fitness baseline without replay; deploy only approved expansions independently. | Protected manual CD reports; candidate/archive/OCI/registry digest comparison; `prisma migrate status`; sanitized schema, checksum, permission, count, and invariant comparisons. | **GO:** promoted content matches the accepted candidate and both databases remain N/N-1 compatible. **STOP:** expired candidate without regeneration/re-gating, digest mismatch, failed migration, destructive diff, data loss/orphans, ledger mismatch, failed backfill, or permission regression. |
| 8. Service cutover | Release operator; write-service owner; SDET; mobile owner/QA | Slice 7 | Establish the versioned synthetic baseline, patch only the live component digest, and run two-minute probe rounds for 30 minutes while verifying provider health, public health, safe read, mobile/error behavior, and release identity. | Allowlisted app-spec diff; deployment status; at least 10 pre-cutover baseline rounds; 15 post-cutover rounds; probe sample/error/p50/p95 evidence; running-digest comparison. | **GO:** every external gate passes and no threshold breaches. **STOP/ROLL BACK APP:** contract/integrity/permission/digest/workflow failure; two consecutive probe 5xx responses; or p95 above both 2x baseline and 1,000 ms for three rounds. One isolated retry only; database stays forward. |
| 9. Observation and acceptance | QA; service/database owners; release operator | Slice 8 | Observe at least 14 calendar days, keep the cutover thresholds active, explicitly exercise a mobile lifecycle and more than one weekly snapshot/report boundary, monitor integrity/errors/latency/deployment stability, and retain recoverable standalone artifacts. | Daily threshold evidence plus incident records and end-window gateway/mobile, ledger/schema/permission/count/invariant, and artifact-reproducibility checks. | **GO:** every condition remains true for the full window. **STOP/ROLL BACK APP:** any cutover-threshold breach, integrity/contract/permission/reproducibility failure, or repeated operational regression; low traffic never waives probes or exercises. |
| 10. Retirement | Repository administrators; security/release owners | Slice 9 acceptance | Commit the recovery-custody manifest with two named custodians; disable mutation paths; verify monorepo replacements; revoke/rotate one credential at a time with checks after each; redirect and archive repositories read-only; preserve histories/releases/artifacts indefinitely pending a separate decision. | Audit workflows/hooks/keys/secrets/artifacts; verify custodian access; run monorepo CI/CD verify-only and production health/integrity/permission/gateway checks before revocation, after each revocation, and after archive. | **GO:** every replacement and retained recovery source remains valid after archive. **STOP:** missing custodian/access evidence, live standalone dependency, failed replacement check, artifact loss, sensitive output, or undocumented recovery source. |

Slices 2 and 3 are independent after curated import. Slice 4 can establish its
unit/API tracer bullet while database work proceeds, but its final component
gate requires the exact OCI candidate from slice 2. Artifact expiry forces
regeneration plus a fresh final gate rather than substitution.
Production mutations remain serial and operator-driven in the cutover order.

## Alternatives considered

### One backend module or local module dependencies

Rejected. A single release unit or `modules.yaml` edges would couple an Express
deployment to two independent migration streams and encourage tests to consume
unreleased local source. Three deep modules with immutable artifact seams give
independent ownership, rollback, credentials, and release history.

### Import standalone Git histories

Rejected. The curated archive is the approved source snapshot; original
repositories remain the historical record. Merging histories would add obsolete
automation and configuration without improving runtime provenance.

### Prisma-native fitness schema or legacy SQL replay

Rejected. Rewriting handwritten constraint/trigger authority into a purely
Prisma-authored model risks semantic drift, while replaying inconsistent base
and duplicate-number SQL risks existing data. Hybrid handwritten SQL inside
Prisma Migrate preserves database semantics while adding checksums and ledger
control.

### Share the fitness database/roles with records

Rejected. `xq-records` is a live, independently governed multi-domain
foundation with no consumer. Separate databases, roles, migration URLs,
workflows, releases, and recovery boundaries prevent accidental coupling.

### Render a complete DigitalOcean app spec or auto-deploy on tag

Rejected. Rendering the full spec would move encrypted runtime configuration
through GitHub and risks unrelated drift. Automatic deployment would bypass the
approved manual promotion and environment review. Live-spec digest-only patching
minimizes the mutation surface.

### Database rollback migrations

Rejected for routine recovery. Expand-and-contract, N/N-1 compatibility, app
rollback, and forward fixes preserve data. Neon recovery remains an exceptional
human-approved response to destructive corruption.

## Residual risks and unresolved evidence

- All four package, audit, image, and component prerequisites are complete.
- The #47-to-#49 OCI handoff is specified, but its workflow implementation and
  digest-preserving GHCR promotion must be verified during the tracer and CD
  tickets.
- Development-only deprecations remain owned by #58, which is planning-ready
  after #49 and must complete by 2026-10-20 without changing runtime behavior.
- The actual monorepo import date/commit cannot be recorded until slice 1 lands.
- Live Neon schemas, ledgers, roles, counts, restore windows, and the live
  DigitalOcean app spec have not been captured. Read-only preflight #60 is the
  explicit evidence gate; slice 6 refreshes that evidence before mutation.
- A future records consumer, v2 API, `/ready` endpoint, authentication change,
  production purge, or artifact-retention cleanup requires its own approved
  design.
