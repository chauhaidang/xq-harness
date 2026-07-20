# 03 — Implement scenario lifecycle inside an execution

**What to build:** A user can create, inspect, and close isolated scenario
sessions inside the active execution using aliases like `@s1`.

**Blocked by:** 01 — Define execution and scenario state interfaces; 02 —
Implement local execution lifecycle against the interfaces.

**Status:** done

- [x] Starting a scenario creates a typed scenario alias in the active
  execution.
- [x] Scenario aliases are never reused inside an execution.
- [x] Scenario status reports scenario state.
- [x] Closing a scenario is irreversible.
- [x] Closed or unknown scenarios fail before HTTP transport.
