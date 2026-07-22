# XQ Fitness backend monorepo onboarding specification

Status: approved design; implementation is gated by the prerequisites below

Source map: [Map the XQ Fitness backend monorepo onboarding](https://github.com/chauhaidang/xq-harness/issues/32)

Snapshot date: 2026-07-20

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

Recorded package-release evidence:

| Package | Release | Tarball SHA-1 | Publish evidence | Clean Node 22 consumer evidence |
| --- | --- | --- | --- | --- |
| `@chauhaidang/xq-harness-test-utils` | `0.1.1` | `32888639ae58798891d47f0ac7adcee7699dc940` | [GitHub Actions run 29930448510](https://github.com/chauhaidang/xq-harness/actions/runs/29930448510) | [GitHub Actions run 29930991976](https://github.com/chauhaidang/xq-harness/actions/runs/29930991976) |
| `@chauhaidang/xq-harness-test-infra` (`xq-infra`) | `0.1.2` | `7eac12c279fa737f35fce643bc8f3f84035fcc92` | [GitHub Actions run 29926867060](https://github.com/chauhaidang/xq-harness/actions/runs/29926867060) | [GitHub Actions run 29927207258](https://github.com/chauhaidang/xq-harness/actions/runs/29927207258) |

Recorded write-service acceptance evidence (2026-07-22):

| Gate | Evidence |
| --- | --- |
| Toolchain | Node `22.15.0`; npm `11.16.0`; exact package tarballs above plus `@chauhaidang/xq-harness-common-kit@0.1.0` SHA-1 `3d3817768521562add1d00e7e7adf64cce38ac68` |
| Archived contract | Archive SHA-256 `1994859408762f3e188dc466fb31ee05b1c8b63cf0a4f1a88a8e849a97e26a38`; 20 OpenAPI operations |
| Service gates | Build, lint, generated CommonJS/ESM client build, and 9 unit suites / 153 tests passed |
| Immutable local images | `xq-fitness-db:acceptance-199485940876` image ID `sha256:6e0409b20581da97dcdff4a1e44d92b3fa1b89b7ed02b8fd03e93ac997dd40b7`; `xq-fitness-write-service:acceptance-199485940876` image ID `sha256:80754c0a17f9e749056555bb13031eda99dc0dfe2f5211c07b139cfdca7743df` |
| Component matrix | Exact `xq-infra@0.1.2` generated and started the matrix with `--no-pull`; all 9 suites / 44 tests passed; teardown left no running containers |

The first three may proceed in parallel. The acceptance-matrix prerequisite
starts only after both package releases are installable. Curated source import,
production cutover, standalone automation retirement, and any claim that
onboarding is accepted must wait until all four are closed with the evidence
described above.

### Execution ticket index

| Slice | Execution ticket |
| ---: | --- |
| 0 | [Publish xq-harness-test-utils for write-service onboarding](https://github.com/chauhaidang/xq-harness/issues/41), [Release npm-compatible xq-harness-test-infra for integration](https://github.com/chauhaidang/xq-harness/issues/42), [Choose the write-service dependency-audit baseline](https://github.com/chauhaidang/xq-harness/issues/44), and [Re-run the write-service image and component acceptance matrix](https://github.com/chauhaidang/xq-harness/issues/43) |
| 1 | [Curate and register the XQ Fitness backend modules](https://github.com/chauhaidang/xq-harness/issues/46) |
| 2 | [Build the verified xq_fitness Prisma baseline](https://github.com/chauhaidang/xq-harness/issues/47) |
| 3 | [Reconcile the live xq-records Prisma contract](https://github.com/chauhaidang/xq-harness/issues/48) |
| 4 | [Onboard the write-service compatibility tracer bullet](https://github.com/chauhaidang/xq-harness/issues/49) |
| 5 | [Add module CI and manual CD workflows for the XQ Fitness backend](https://github.com/chauhaidang/xq-harness/issues/50) |
| 6 | [Inventory production and configure isolated deployment environments](https://github.com/chauhaidang/xq-harness/issues/51) |
| 7 | [Publish immutable backend releases and reconcile both Neon databases](https://github.com/chauhaidang/xq-harness/issues/52) |
| 8 | [Cut over the XQ Fitness write service on DigitalOcean](https://github.com/chauhaidang/xq-harness/issues/53) |
| 9 | [Observe and accept the XQ Fitness backend cutover](https://github.com/chauhaidang/xq-harness/issues/54) |
| 10 | [Retire the standalone XQ Fitness backend repositories](https://github.com/chauhaidang/xq-harness/issues/55) |

## Provenance and curated import

### Snapshot identity

| Item | Value |
| --- | --- |
| Archive | `xq-fitness-backend-source-2026-07-20.tar.gz` |
| SHA-256 | `1994859408762f3e188dc466fb31ee05b1c8b63cf0a4f1a88a8e849a97e26a38` |
| Archive roots | `write-service/`, `database/`, `xq-records/` |
| Write-service history | [chauhaidang/xq-fitness-write](https://github.com/chauhaidang/xq-fitness-write) |
| Fitness database history | [chauhaidang/xq-fitness-db](https://github.com/chauhaidang/xq-fitness-db) |
| Records database history | [chauhaidang/xq-records](https://github.com/chauhaidang/xq-records) |
| Monorepo import date and commit | Record when the curated-import slice lands; source has not yet been imported. |

The archive, not a checkout of any standalone repository, is the import input.
The original repositories retain pre-monorepo history. Recompute the checksum
before import and stop if it differs.

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
consumes released, exact artifacts. This keeps release cadence, production
credentials, migration authority, and failure containment independent.

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

Use Neon point-in-time recovery only for confirmed destructive corruption or
operator error when a data-preserving forward fix is unsafe. It requires human
approval, an independently rehearsed procedure, a verified restore window or
recovery branch, and full ledger/schema/data/permission validation afterward.

## Production rollout and validation

### Pre-cutover inventory

Before mutation, capture sanitized evidence for both databases: PostgreSQL and
Prisma versions/status; migration names/checksums; schema objects; roles and
grants; restore window/recovery point; and table row counts without row data.
Also capture the DigitalOcean app/component identity, live digest, route,
encrypted-setting names, deployment ID, and previous known-good release.

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
2. Close all four prerequisites and pass all three module CI contracts from a
   clean checkout.
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

Preserve existing issues, releases, histories, GHCR images, and npm packages.
Do not delete the standalone repositories, the live app, either Neon database,
public gateway, production data, or old artifacts. Further cleanup needs a
separate retention decision.

## Implementation slices and gates

Owners below are accountable roles, not authorization to bypass protected
environment approval.

| Slice | Owner(s) | Depends on | Deliverable and acceptance criteria | Verification | Stop/go gate |
| ---: | --- | --- | --- | --- | --- |
| 0. Release prerequisites | Test-utils/test-infra maintainers; write-service owner; security reviewer | None; acceptance matrix waits for both package releases | Close the four linked prerequisite tickets with immutable versions, clean npm 11 installation evidence, approved audit disposition, and the full image/component matrix. | Ticket-specific clean install/audit/image/component commands; record exact versions and digests in the tickets and module lockfile/config. | **GO:** all four evidence sets approved. **STOP:** unpublished/local dependency, invalid npm graph, expired/unowned audit exception, or failed matrix. |
| 1. Curated import and registration | Backend engineer for each module; solution designer reviews boundaries | Slice 0 and verified archive checksum | Import only mapped inputs; add three independent `modules.yaml` registrations and `version.yaml` files with no cross-module `depends_on`; correct metadata/env examples; translate workflows/agents/docs; link each README here; record import date/commit. No generated/report/secret files. | `./scripts/module list`; `./scripts/module info xq-fitness-write-service`; `./scripts/module info xq-fitness-db`; `./scripts/module info xq-records`; `python3 scripts/validate-module-versions.py`; `git diff --check` | **GO:** checksum/source map and clean registrations agree. **STOP:** any prerequisite remains open, provenance mismatch, secret/generated output, local dependency edge, or unresolved ADR conflict. |
| 2. Fitness baseline tracer bullet | Fitness DB backend engineer; database reviewer; SDET | Slice 1 | Reconcile live schema-only evidence and legacy SQL; create verified `00000000000000_baseline`; preserve legacy files as non-executable history; make seeds explicit/idempotent; implement fresh migration, drift, role, smoke, compatibility, image, and client dry-run tests. No production resolution yet. | `./scripts/module ci xq-fitness-db`; module commands for `prisma validate`, `prisma generate`, fresh `prisma migrate deploy`, drift, seed-twice, restricted-role and smoke tests; `git diff --check` | **GO:** disposable result, Prisma contract, and sanitized live snapshot are equivalent. **STOP:** unexpected drift, destructive difference, seed mutation of non-reference data, or unverified recovery point. |
| 3. Records preservation tracer bullet | Records DB backend engineer; database reviewer; SDET | Slice 1 | Preserve schema/migrations; reconcile live schema/data-presence/ledger; add PostgreSQL 18 from-zero, history, role, drift, smoke, and image gates; remove normal-CD role modes; publish no client. | `./scripts/module ci xq-records`; module commands for `prisma validate`, `prisma generate`, fresh `prisma migrate deploy`, `prisma migrate status`, history/restricted-role tests, and Docker build; `git diff --check` | **GO:** live state and checked-in history reconcile, or an explicit approved baseline plan exists. **STOP:** ledger divergence, lost data, broadened permissions, invalid current-version pointers, or invented consumer requirements. |
| 4. Write-service compatibility tracer bullet | Write-service backend engineer; SDET; mobile owner | Slices 0 and 1; immutable fitness DB artifact from slice 2 for final component gate | Adapt Node 22/npm 11; correct package names; deterministic ignored-client bootstrap; preserve raw `pg`, 20 operations, gateway/health/errors; implement semantic spec diff, route parity, CJS/ESM, unit, Docker, pinned component, and mobile Axios gates. | `./scripts/module ci xq-fitness-write-service`; OpenAPI validate/lint/diff; clean-tree generation; build/lint/unit/contract/client/Docker/component/mobile commands; `git diff --check` | **GO:** all 20 operations and external mobile workflows pass against exact artifacts. **STOP:** breaking diff, generated-tree drift, unpinned dependency/image, image failure, or route/error/health change. |
| 5. Six workflow entry points | Backend owners; release engineering; security reviewer | Slices 2–4 | Add the six path-scoped CI/manual-only CD files with isolated permissions/environments/concurrency, immutable artifact reuse, sanitized reports, digest-only DO patch, and one-action Neon deploys. Prove PR/push/tag cannot invoke CD. | Workflow lint/tests; dry-run dispatch validation with no production secrets; CI runs for each module; inspect effective permissions and path filters; `git diff --check` | **GO:** dry runs show exact targets and zero mutation before approval. **STOP:** automatic CD trigger, shared production credential, mutable tag, full app-spec rendering, cross-database access, or unmasked secret. |
| 6. Production inventory and environment readiness | Release operator; database owners; security reviewer | Slices 2–5 | Capture sanitized before-state and recovery evidence; configure three protected environments; prove credential isolation; record previous known-good releases and named recovery owners. | Read-only DigitalOcean live-spec/component check; read-only Prisma status/schema/role/invariant checks for each Neon database; restore-window/recovery rehearsal evidence. | **GO:** inventories reconcile and every environment reaches only its target. **STOP:** missing recovery point, ambiguous app component, credential crossover, drift, permission broadening, or sensitive output. |
| 7. Immutable releases and database reconciliation | Release operator; database owners | Slice 6 | Manually release all modules; record commit/version/digest; resolve the verified fitness baseline without replay; deploy only approved backward-compatible expansions independently; validate after each. | Protected manual CD reports; `prisma migrate status`; sanitized before/after schema, checksums, permissions, counts, and invariants; artifact digest verification. | **GO:** both databases pass post-deploy evidence and remain N/N-1 compatible. **STOP:** failed/partial logical migration, destructive diff, data loss/orphans, ledger mismatch, failed backfill, or permission regression. |
| 8. Service cutover | Release operator; write-service owner; SDET; mobile owner/QA | Slice 7 | Patch only the live component digest; verify provider health, public health, safe read, all representative mobile workflows, error behavior, and release reproducibility. | Sanitized allowlisted app-spec diff; DigitalOcean deployment status; external gateway health/read smoke; mobile compatibility suite; compare running digest with release report. | **GO:** recorded digest runs and every external gate passes. **STOP/ROLL BACK APP:** unrelated spec diff, provider/health/read/mobile failure, critical 5xx, or material latency regression. Database stays forward. |
| 9. Observation and acceptance | QA; service/database owners; release operator | Slice 8 | Observe at least 14 calendar days, explicitly exercise a mobile lifecycle and weekly snapshot/report boundary, monitor integrity/errors/latency/deployment stability, and retain recoverable standalone artifacts. | Daily/incident evidence plus end-window rerun of gateway/mobile, ledger/schema/permission/count/invariant, and artifact-reproducibility checks. | **GO:** every acceptance condition remains true for the full window. **STOP:** integrity/contract/permission/reproducibility failure or repeated deployment/error/latency regression; low traffic never waives explicit exercises. |
| 10. Retirement | Repository administrators; security/release owners | Slice 9 acceptance | Point standalone repositories to monorepo modules; remove mutation integrations; revoke/rotate superseded credentials after replacement verification; archive read-only; preserve histories/releases/artifacts. | Confirm standalone workflow mutation is disabled; audit hooks/keys/secrets and provider access; re-run monorepo CD dry-run and production health/integrity checks. | **GO:** monorepo replacements and recovery evidence remain valid after revocation. **STOP:** any live dependency on a standalone credential, workflow, artifact mutation path, or undocumented recovery source. |

Slices 2 and 3 are independent after curated import. Slice 4 can establish its
unit/API tracer bullet while database work proceeds, but its final component
gate requires the released fitness database artifact and all prerequisites.
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

- The package-release prerequisites are complete. The audit disposition and
  image/component acceptance matrix remain open and must be approved before
  import acceptance and cutover.
- The actual monorepo import date/commit cannot be recorded until slice 1 lands.
- Live Neon schemas, ledgers, roles, counts, restore windows, and the live
  DigitalOcean app spec have not been captured by this planning document. Slice
  6 is deliberately a hard gate rather than an assumed match.
- A future records consumer, v2 API, `/ready` endpoint, authentication change,
  production purge, or artifact-retention cleanup requires its own approved
  design.
