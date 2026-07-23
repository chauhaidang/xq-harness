# XQ Records database

Prisma schema, append-only migration history, PostgreSQL 18 image inputs, and
smoke tests for the independent XQ Records database.

This module was curated from `chauhaidang/xq-records` commit
`d9acc0fa21b16968c6cdf196c5e1ad63ff9a809b` through replacement archive SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`.
The source version is `1.0.0`. Issue #48 owns live-ledger reconciliation and the
restricted-role/fresh-migration tracer bullet; no Prisma client is published
until a consumer contract exists.

Use `./scripts/module info xq-records` from the repository root. The full
migration contract is in
[`docs/migrations/xq-fitness-backend-2026-07-20.md`](../../docs/migrations/xq-fitness-backend-2026-07-20.md).
