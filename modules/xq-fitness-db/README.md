# XQ Fitness database

Schema, Prisma configuration, disposable database inputs, and smoke tests for
the XQ Fitness PostgreSQL database.

This module was curated from `chauhaidang/xq-fitness-db` commit
`450f6b6157f622dc3f6a98fdaa52953ce4c88ae3` through replacement archive SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`.
The source version is `1.0.0`.

Historical standalone SQL is retained under `docs/legacy-history` for
reconciliation only. It is not an executable migration or Docker-init path.
Issue #47 owns the verified Prisma baseline, disposable-image contract, and
live-schema reconciliation.

Use `./scripts/module info xq-fitness-db` from the repository root. The full
migration contract is in
[`docs/migrations/xq-fitness-backend-2026-07-20.md`](../../docs/migrations/xq-fitness-backend-2026-07-20.md).
