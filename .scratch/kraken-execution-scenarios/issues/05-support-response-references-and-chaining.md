# 05 — Support response references and chaining in scenario state

**What to build:** `kraken invoke` can persist response snapshots as `@rN`,
resolve `$kraken_ref` JSON Pointer expressions from the selected scenario,
enforce per-scenario retention limits, and keep `--no-state` behavior working.

**Blocked by:** 01 — Define execution and scenario state interfaces; 04 — Move
operation references into scenario-scoped execution state.

**Status:** done

- [x] Retained invocations allocate response references inside the selected
  scenario.
- [x] Response references are immutable snapshots.
- [x] `$kraken_ref` input substitution resolves only inside the selected
  scenario.
- [x] JSON Pointer resolution preserves JSON types.
- [x] Per-scenario retention limits and `--no-state` remain enforced.
