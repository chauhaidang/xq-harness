# XQ Fitness write service

Express and raw-PostgreSQL implementation of the XQ Fitness v1 read/write API.
The canonical API contains 20 operations in `api/write-service-api.yaml`.

This module was curated from `chauhaidang/xq-fitness-write` commit
`49ebb1baa58c377b6e8281463db491d077ab086b` through replacement archive SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`.
Source version `2.1.0` is preserved for import provenance. Issue #49 owns the
first monorepo release bump to `3.0.0` and the complete compatibility gate.

Use `./scripts/module info xq-fitness-write-service` from the repository root.
Generated OpenAPI clients, build output, coverage, and component reports are
ignored. Generate clients before a clean development install. Registry access
comes from user or CI configuration; this module contains no `.npmrc`.

The full migration contract and exclusions are in
[`docs/migrations/xq-fitness-backend-2026-07-20.md`](../../docs/migrations/xq-fitness-backend-2026-07-20.md).
