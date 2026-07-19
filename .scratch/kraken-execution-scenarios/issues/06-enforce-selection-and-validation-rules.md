# 06 — Enforce scenario selection and execution validation rules

**What to build:** Scenario-bound commands fail correctly for missing execution,
changed config or specs, missing scenario, ambiguous scenario, closed scenario,
and unknown scenario before reference resolution or HTTP transport.

**Blocked by:** 02 — Implement local execution lifecycle against the
interfaces; 03 — Implement scenario lifecycle inside an execution; 04 — Move
operation references into scenario-scoped execution state; 05 — Support response
references and chaining in scenario state.

**Status:** done

- [x] Commands validate the active execution before reference resolution or
  HTTP transport.
- [x] Commands fail with `execution_config_changed` when config or referenced
  specs change during an active execution.
- [x] Scenario-bound commands may omit a scenario only when exactly one scenario
  is open.
- [x] Commands fail with `scenario_required` when no open scenario is available.
- [x] Commands fail with `scenario_ambiguous` when multiple open scenarios
  exist and no scenario is specified.
