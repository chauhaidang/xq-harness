# ADR 0002: Add non-rebinding stateful CLI references

- Status: Accepted
- Date: 2026-07-19

## Context

Kraken serves humans and LLM agents across separate CLI invocations. The
operation-centric interface is deterministic, but a caller must otherwise copy
and retain API names, operation IDs, and values returned by earlier requests.

Vibium demonstrates a useful agent interaction: a discovery command maps large
or brittle targets to short handles such as `@e1`, and later commands resolve
those handles from tool-owned state. Vibium's current mapping is held by a
daemon and rebuilt by later discovery commands. Kraken can adopt the short
handle while using stronger identity and invalidation guarantees appropriate
for API operations and immutable responses.

OpenAPI operation IDs are already stable public identifiers. References do not
replace them; they bind the additional context an agent would otherwise need
to repeat and provide a safe bridge between command results.

## Decision

### Typed reference namespaces

Kraken uses separate typed namespaces:

- `@oN` identifies an operation
- `@rN` identifies one immutable normalized invocation result

Reference numbers increase monotonically within a scenario session. Kraken
never silently rebinds a reference to a different target and never recycles a
cleared or expired number.

An unresolved reference is always a reference error. Kraken must not fall back
to treating it as an operation ID or ordinary input data.

### Operation discovery and use

Search returns structured results containing a reference, API name, operation
ID, and summary:

```json
{
  "results": [
    {
      "ref": "@o1",
      "api": "widgets",
      "operation_id": "getWidget",
      "summary": "Get one widget"
    }
  ]
}
```

`kraken search <query>` without `--api` searches every configured API. It
applies each API definition's operation allowlist before combining results.
Results have a deterministic ordering by API name and then operation ID.

`kraken search --api <name> <query>` limits discovery to one API definition.

Describe and invoke accept either an explicit operation ID or an operation
reference:

```text
kraken describe @o1
kraken invoke @o1 --input request.json
```

An operation reference binds both the API definition and operation ID, so
`--api` is neither required nor accepted when a reference is used. Successful
describe and invoke results echo the resolved `ref`, `api`, and `operation_id`
for auditability.

Repeated searches return the existing reference for the same configured API
and operation ID. Later searches append new bindings; they do not replace the
active mapping.

Explicit operation IDs remain supported. With multiple API definitions, an
explicit operation ID requires `--api` even if it is currently unique across
the configuration. This keeps stateless behavior independent of incidental
cross-spec uniqueness.

### Executions and scenario sessions

References persist across ordinary CLI processes in a local execution. An
execution is the top-level run context for one LLM or human testing run and may
contain multiple scenario sessions. Each scenario session isolates operation
references and response snapshots for exactly one backend test scenario.

Kraken resolves the active execution only from the exact process working
directory:

- `./kraken.yaml`
- `./.kraken/execution.sqlite`

Kraken does not search parent directories and does not use global or
environment-based execution lookup. If `kraken.yaml` or the active execution
store is missing, stateful commands fail before HTTP transport.

`kraken execution start` creates `./.kraken/execution.sqlite` beside the exact
`kraken.yaml` in the current directory and returns execution alias `@e1`.
Only one execution may be active for that directory. If the execution store
already exists, start fails with `execution_already_active`; Kraken does not
join, replace, or multiplex executions implicitly.

`kraken scenario start` creates typed scenario aliases such as `@s1` inside the
active execution. Scenario-bound commands may omit `--scenario` only when
exactly one scenario session is open. If zero or multiple scenarios are open,
they must identify the scenario explicitly. Scenario identities are never
reused after close.

The execution is bound to:

- canonical configuration path
- fingerprint of `kraken.yaml`
- fingerprint of every referenced OpenAPI specification

References cannot resolve across executions or scenario sessions. Configuration
or specification changes during an active execution fail explicitly with
`execution_config_changed` before reference resolution or HTTP transport.

The store uses SQLite with user-only file permissions. SQLite provides atomic
reference allocation and safe convergence when multiple CLI processes operate
inside the same active execution. Allocation and target creation occur in one
transaction, and canonical operation identity is unique within a scenario
session.

`kraken execution finish` is authoritative teardown: it closes any still-open
scenario sessions and removes the local SQLite file. If a process crashes and
leaves an execution store behind, a later start reports `execution_stale` after
the inactivity TTL and requires explicit `kraken execution cleanup` before a
new execution can start.

### Reference validity

An operation reference is revalidated when used:

- its API definition must still exist
- its operation ID must still exist in that API's current specification
- the operation must still be visible under the current allowlist

Because an execution is bound to configuration and specification fingerprints,
specification-content changes fail at execution validation before operation
reference revalidation. Within an unchanged execution, a removed or newly
disallowed operation invalidates its reference. An invalidated reference
remains a tombstone and is never assigned to another operation.

### Response references and input substitution

An invocation without assertions returns the complete normalized response as
defined by ADR 0001 and may also allocate a response reference:

```json
{
  "ref": "@r1",
  "operation_ref": "@o1",
  "api": "widgets",
  "operation_id": "createWidget",
  "status_code": 201,
  "data": {
    "id": "widget-123"
  }
}
```

A later invocation references response data through an explicit typed
expression in its JSON input:

```json
{
  "parameters": {
    "widgetId": {
      "$kraken_ref": "@r1",
      "pointer": "/id"
    }
  }
}
```

Kraken resolves reference expressions recursively before OpenAPI request
validation. `pointer` is an RFC 6901 JSON Pointer into the referenced response
data. Resolution preserves the stored JSON type.

Ordinary strings beginning with `@o` or `@r` are never implicitly substituted.
The explicit `$kraken_ref` object prevents legitimate API data from being
misinterpreted as state.

Response references identify immutable snapshots and never follow a later
invocation. They expire by a documented retention period or explicit cleanup.
Their JSON bodies may contain sensitive data, so the implementation must:

- use user-only storage permissions
- provide `--no-state` to suppress response persistence for an invocation
- enforce a bounded retention period and storage size
- provide explicit listing and cleanup commands
- avoid persisting response headers by default
- avoid persisting request bodies

Response snapshots expire 24 hours after creation. Retained canonical response
snapshots are capped at 50 MiB per scenario session, measured as UTF-8 JSON
bytes. Before insertion, Kraken removes expired responses and then evicts the
oldest unexpired responses until the new snapshot fits. A single oversized
response is not retained; its invocation still succeeds and reports
`response_ref: null` with reason `response_too_large` and
`max_bytes: 52428800`.

### Commands for inspection and recovery

The stateful layer provides:

```text
kraken execution start
kraken execution status
kraken execution finish
kraken execution cleanup
kraken scenario start
kraken scenario status @s1
kraken scenario close @s1
kraken refs list
kraken refs status
kraken refs gc
kraken refs clear
kraken resolve @o1
kraken resolve @r1 --pointer /id
```

`refs clear` tombstones active references and deletes retained response data
inside the selected scenario session; it does not reset the monotonic counters.

### Failures

Reference resolution uses exit code `8` and structured error kinds:

- `unknown_reference`
- `expired_reference`
- `reference_kind_mismatch`
- `reference_context_mismatch`
- `reference_target_removed`
- `invalid_reference_pointer`
- `reference_store_busy`
- `reference_store_corrupt`

Malformed reference syntax remains CLI input error `2`. If an operation
reference resolves but the operation is now disallowed, Kraken uses operation
exit code `3` and does not disclose the hidden operation contract.

Reference failures occur before HTTP transport.

Execution and scenario validation failures use structured error kinds:

- `execution_required`
- `execution_already_active`
- `execution_stale`
- `execution_config_changed`
- `scenario_required`
- `scenario_ambiguous`
- `unknown_scenario`
- `scenario_closed`

Execution and scenario failures occur before reference resolution and HTTP
transport.

## Delivery sequence

The behavior is delivered in two slices:

1. Operation references: local execution store, scenario sessions, cross-API search,
   non-rebinding allocation, describe/invoke resolution, revalidation, and
   recovery errors.
2. Response references: immutable response persistence, explicit JSON Pointer
   substitution, retention and size limits, opt-out, and cleanup.

The first slice is independently useful and does not require persisting API
response data.

## Consequences

- Agents carry compact handles while Kraken retains full API and operation
  identity.
- Cross-API search no longer forces an agent to choose or remember an API
  before discovery.
- Stateless scripts remain supported through explicit API names and operation
  IDs.
- Non-rebinding allocation prevents a valid-looking reference from silently
  targeting a different operation.
- One active execution per exact `kraken.yaml` directory keeps ordinary command
  invocations ergonomic without global state or repeated execution flags.
- Scenario sessions isolate parallel backend scenarios inside one execution
  while sharing one local SQLite file for that run.
- Local persistence introduces concurrency, cleanup, privacy, corruption, and
  migration responsibilities.
- Response chaining becomes deterministic without string coercion or manual
  copying, but retaining response JSON requires explicit privacy controls.

## Rejected alternatives

### Rebuild and reuse `@o1` after every search

Rejected because an old reference could silently target a different operation.

### One untyped `@eN` namespace

Rejected because operation and response handles have different validity,
retention, privacy, and input constraints. Typed prefixes make mistakes easier
to diagnose.

### Require `--execution` or `KRAKEN_EXECUTION` on every command

Rejected because it makes ordinary agent and human workflows too verbose. The
execution store already lives beside the exact `kraken.yaml`, so the current
working directory is a deterministic locator without parent-directory search or
global lookup.

### Implicitly substitute any string beginning with `@`

Rejected because legitimate API data could be corrupted. Substitution requires
an explicit `$kraken_ref` expression.

### Keep state only in the CLI process

Rejected because each ordinary CLI command runs in a separate process and the
tool would not remember references for the next agent action.

### Add a background daemon

Rejected because Kraken does not already require a long-lived external process.
A transactional local store provides the needed continuity with less lifecycle
machinery.

### Store references in the project configuration

Rejected because runtime state should not mutate or be committed with
`kraken.yaml`.

### Store execution state in a per-user application directory

Rejected because it requires explicit execution locators or hidden global
lookup. Storing the active execution beside the exact local configuration keeps
the command surface compact while preserving one-active-execution isolation.
