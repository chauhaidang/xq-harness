# 02 — Implement local execution lifecycle against the interfaces

**What to build:** A user can run `kraken execution start`, `status`, `finish`,
and `cleanup` from the exact directory containing `kraken.yaml`. Kraken creates
`./.kraken/execution.sqlite`, refuses a second active execution, and deletes the
SQLite file on finish or cleanup.

**Blocked by:** 01 — Define execution and scenario state interfaces.

**Status:** done

- [x] Starting an execution creates local runtime state beside `kraken.yaml`.
- [x] Starting a second execution fails with `execution_already_active`.
- [x] Stateful commands fail with `execution_required` when no execution exists.
- [x] Finishing an execution removes local runtime state.
- [x] Cleanup removes abandoned local runtime state.
