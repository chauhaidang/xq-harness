# XQ Kraken Context

## Purpose

XQ Kraken lets a caller discover and invoke REST API operations through an
OpenAPI contract. Its public domain boundary is operation-centric: callers use
an OpenAPI `operationId`, while Kraken owns request and response validation and
keeps its OpenAPI transport library private.

The primary callers are humans and LLM agents. Both callers receive the same
deterministic command behavior and JSON contracts.

## Boundary

Kraken owns:

- loading local OpenAPI specifications
- selecting a named API definition
- discovering allowed operations
- describing an operation's contract
- validating and invoking an operation
- normalizing invocation results
- evaluating explicit response assertions at the application boundary
- persisting context-bound operation and response references in local user state

Kraken does not currently own:

- generic path-and-HTTP-verb commands
- remote OpenAPI document retrieval
- authentication or secret management
- generated SDKs
- declarative multi-step test-suite syntax or snapshot assertions

## Glossary

### API definition

A named runtime configuration containing one local OpenAPI specification, its
base URL, and an optional operation allowlist. Use **API definition**, not
*service config* or *spec entry*, in caller-facing contracts.

### Selected API

The API definition chosen for one command. A caller selects it with `--api`
when an explicit operation ID would otherwise be ambiguous. A cross-API search
does not require a selected API, and an operation reference carries its API
identity with it.

### Operation

One HTTP operation identified by its OpenAPI `operationId`. The operation ID is
the stable caller-facing key for discovery, description, and invocation.

### Operation allowlist

An optional set of operation IDs visible to a caller. If the allowlist is
omitted, every operation in the selected API is available. An explicitly empty
allowlist makes no operations available.

### Invocation input

The JSON document supplied to `kraken invoke`. It may contain `parameters`, a
request `body`, and response `assertions`.

### Invocation result

A normalized documented HTTP response returned by the Kraken domain client.
A documented non-2xx response is still an invocation result; command success
depends on its assertions or, when none are supplied, its status class.

### Response assertion

A deterministic check against the invocation status or a response-body value
selected with JSON Pointer. Body expectations use partial semantic matching.

### Unmatched field

A requested response assertion that did not match. Assertion failure output
contains unmatched fields rather than the complete response payload.

### Reference session

A named, local state scope in which Kraken allocates short references. The
session is bound to one canonical configuration context and persists across
ordinary CLI processes.

### Operation reference

A non-rebinding handle such as `@o1` that identifies both an API definition and
an operation ID. Search creates operation references; describe and invoke
consume them without requiring `--api`.

### Response reference

A handle such as `@r1` that identifies one immutable normalized invocation
result. Response references support later workflow chaining through an
explicit reference expression and expire according to the session's retention
policy.

## Policies

- Public interfaces must not expose `aiopenapi3` types.
- CLI JSON is the canonical automation contract; pretty output is a human view
  of the same result.
- Assertions belong to the CLI/application layer, not `KrakenClient`.
- Operation discovery must apply the same allowlist as description and
  invocation.
- A reference must never silently change targets or be recycled within its
  reference session.
- Explicit API names and operation IDs remain the stateless public interface;
  references are an automation convenience.
