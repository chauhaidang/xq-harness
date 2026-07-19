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

Reference numbers increase monotonically within a reference session. Kraken
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

### Reference sessions

References persist across ordinary CLI processes in a local reference session.
The default session is scoped to the canonical configuration-file path. A
caller may isolate concurrent work with `--session <name>` or the
`KRAKEN_SESSION` environment variable; the explicit flag takes precedence.

The effective configuration context includes:

- canonical configuration path
- selected command-line specification override, when present
- selected command-line base-URL override, when present

References cannot resolve across configuration contexts. A mismatch fails
explicitly instead of looking up the same ordinal in another context.

Local state lives in the platform's per-user application-state directory. On
systems that define `XDG_STATE_HOME`, Kraken stores it below
`$XDG_STATE_HOME/kraken`. State is not written beside `kraken.yaml` and must not
be committed to the project.

The store uses SQLite with user-only file permissions. SQLite provides atomic
reference allocation and safe convergence when multiple CLI processes search
or invoke concurrently. Allocation and target creation occur in one
transaction, and canonical operation identity is unique within a context.

### Reference validity

An operation reference is revalidated when used:

- its API definition must still exist
- its operation ID must still exist in that API's current specification
- the operation must still be visible under the current allowlist

A specification-content change does not renumber an operation that retains the
same operation ID. A removed or newly disallowed operation invalidates its
reference. An invalidated reference remains a tombstone and is never assigned
to another operation.

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
snapshots are capped at 50 MiB per reference session, measured as UTF-8 JSON
bytes. Before insertion, Kraken removes expired responses and then evicts the
oldest unexpired responses until the new snapshot fits. A single oversized
response is not retained; its invocation still succeeds and reports
`response_ref: null` with reason `response_too_large` and
`max_bytes: 52428800`.

### Commands for inspection and recovery

The stateful layer provides:

```text
kraken refs list
kraken refs status
kraken refs gc
kraken refs clear
kraken resolve @o1
kraken resolve @r1 --pointer /id
```

`refs clear` tombstones active references and deletes retained response data;
it does not reset the monotonic counters.

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

## Delivery sequence

The behavior is delivered in two slices:

1. Operation references: persistent session store, cross-API search,
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
