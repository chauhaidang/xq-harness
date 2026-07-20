# 04 — Move operation references into scenario-scoped execution state

**What to build:** `kraken search`, `describe`, `refs`, and `resolve @oN` use
the active execution and selected scenario instead of old reference sessions.

**Blocked by:** 01 — Define execution and scenario state interfaces; 03 —
Implement scenario lifecycle inside an execution.

**Status:** done

- [x] Operation references are allocated inside the selected scenario session.
- [x] The same operation can receive independent aliases in different
  scenarios.
- [x] Operation references remain non-rebinding and are not recycled.
- [x] `describe`, `refs`, and `resolve @oN` operate through the active execution
  and selected scenario.
- [x] Legacy session flags and per-user state no longer drive operation
  references.
