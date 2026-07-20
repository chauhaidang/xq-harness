# 01 — Define execution and scenario state interfaces

**What to build:** Stable application-layer contracts for execution lifecycle,
scenario lifecycle, scenario selection, aliases, fingerprint validation, and
reference allocation so implementation and tests can evolve independently of
CLI parsing.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Execution lifecycle is expressed through the execution runtime interface.
- [x] Scenario lifecycle and selection are expressed through active execution
  and scenario handle abstractions.
- [x] Reference allocation and resolution are scoped to a selected scenario.
- [x] Fingerprint validation runs before reference resolution or transport.
- [x] Contract tests cover aliases, execution lifecycle, scenario selection,
  and scenario-scoped reference allocation.
