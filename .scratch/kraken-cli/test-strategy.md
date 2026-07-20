# Kraken CLI Test Strategy

Status: proposed local test strategy

Scope: Kraken module only

Sources: accepted CLI specification, ADR 0001, ADR 0002, and the proposed 12-ticket delivery plan

## 1. Quality objective

Prove that the packaged `kraken` executable is a stable automation contract for humans and LLM agents across independent processes.

The test program must establish that:

- arguments, configuration, JSON input, and standard input are interpreted consistently;
- canonical JSON, stdout, stderr, and exit codes follow the public contract;
- invalid input and invalid references cannot trigger HTTP transport;
- OpenAPI request and response contracts remain authoritative;
- documented non-2xx responses remain distinguishable from transport and contract failures;
- focused assertions compare only requested data and report unmatched assertions only;
- operation and response references are durable, immutable, isolated, non-rebinding, privacy-bounded, and concurrency-safe;
- response retention expires and evicts data deterministically without changing reference identity.

Unit tests localize failures, but they do not replace proof through an installed CLI subprocess.

## 2. Ownership

| Role | Owns | Does not own |
|---|---|---|
| SDET | Risk model, automated strategy, installed-process Behave suite, focused test seams, fixtures, deterministic concurrency/time/storage tests, CI diagnostics, flake policy | Product behavior decisions or production fixes |
| QA | Exploratory user and LLM journeys against runnable builds, adversarial combinations, evidence, severity, regression boundaries, fix verification when requested | Internal diagnosis, automated suite implementation, or acceptance-criteria changes |
| Backend | Product implementation and the minimum testability seams agreed with SDET | Weakening tests or redefining public behavior inside implementation |
| Root/solution owner | Reconciles the specification, tickets, role boundaries, and release decision | Treating an untested area as passed |

QA observes public commands and documented filesystem promises. SQLite rows, private transport objects, and in-process CLI framework objects are not product oracles.

## 3. Risk model

| Risk | Severity | Required evidence |
|---|---:|---|
| Invalid input or reference sends an unintended HTTP request | Critical | Installed subprocess result plus an empty local-server request ledger |
| A reference rebinds, is recycled, or crosses a session/context | Critical | Independent-process lifecycle scenarios and concurrent allocation tests |
| `--no-state`, assertions, or retention rules leak forbidden data | Critical | Public behavior plus storage-service privacy checks with sentinel values |
| Documented non-2xx is confused with transport, contract, or assertion failure | High | Adapter contract tests and exact subprocess stream/exit assertions |
| JSON envelopes, streams, or exit codes drift | High | Installed-process public-contract checks |
| Matching falsely passes, especially arrays, duplicates, or bool/number values | High | Exhaustive matcher tables plus representative CLI journeys |
| Concurrent processes allocate duplicates or corrupt state | High | Barrier-released process fan-out and SQLite service tests |
| TTL, eviction, or oversized responses delete or rebind the wrong state | High | Injected clock/limit tests plus fixed public boundary checks |
| Allowlist behavior differs across search, describe, invoke, and revalidation | High | Cross-command acceptance matrix |
| Tests depend on ports, sleeps, clocks, or a developer's state | High | Isolated harness, readiness events, barriers, injected policies, and zero retries |

Any nondeterministic reference identity, privacy result, or unintended transport is at least High until evidence bounds its impact.

## 4. Test seams

### 4.1 Primary acceptance seam

Build a wheel, install it into a clean environment, and run the installed `kraken` executable as a real subprocess from Behave. Do not use an in-process CLI runner or `python -m` as release evidence.

Each scenario may observe only:

- argv, working directory, stdin, and controlled environment variables;
- stdout and stderr as separate byte streams;
- numeric exit code;
- a deterministic local server's request ledger;
- public state observed by a later, separately launched process;
- documented filesystem behavior such as state location, permissions, and bounded size.

Canonical JSON is the complete agent contract. `--pretty` receives focused human-usability smoke coverage. Tests assert relevant JSON fields rather than key serialization order or incidental prose.

### 4.2 Supporting seams

1. **Domain adapter contracts:** existing `unittest` style with a local transport, covering documented 2xx/non-2xx normalization and transport, undocumented-status, and response-schema classifications.
2. **Pure matching:** table-driven tests for RFC 6901 JSON Pointer resolution and recursive semantic subset matching.
3. **Reference/session service:** temporary SQLite stores with injected clock and storage policy, covering allocation, deduplication, tombstones, migrations, expiry, eviction, privacy, and error classification.
4. **Packaging:** install the built wheel into a fresh environment, run `kraken --help`, then run at least one real command.

Private database schemas and third-party library types must not become acceptance-test seams.

## 5. Deterministic harness and fixtures

Every automated scenario and QA run uses a fresh temporary root containing configuration, OpenAPI documents, invocation JSON, and `XDG_STATE_HOME`.

- Give each scenario a unique session. Share a session only when testing continuity or concurrency.
- Unset inherited Kraken configuration/session variables, proxies, and user state unless the scenario explicitly tests precedence.
- Resolve spec paths relative to generated configuration, then run selected cases from another working directory.
- Use two small local APIs with overlapping `operationId` values, visible and hidden operations, documented 2xx/4xx/5xx responses, and invalid/undocumented response routes.
- Bind the HTTP server to `127.0.0.1` port `0`; signal readiness with an event, never a sleep.
- Give the server a scripted response queue and append-only request ledger with method, path, query, relevant fixture headers, and parsed body.
- Bound every subprocess. On failure preserve argv, redacted environment, both streams, exit code, fixtures, ledger, and isolated state.
- Release concurrent child processes with a barrier, collect every result, and assert convergence and uniqueness without retry.
- Inject time and storage limits at the service seam. Do not add production-only test flags or wait 24 hours.
- Keep one installed-process check at the exact 50 MiB (`52,428,800` bytes) contract; exercise most size permutations with a smaller injected service limit.
- Test busy stores with a deliberate lock and known timeout. Test corruption and migrations from copied immutable fixtures.

QA additionally covers paths and session names containing spaces and non-ASCII characters on macOS and Linux/XDG where runners are available.

## 6. Assertion coverage

The pure matcher suite must cover:

- root pointers and escaped `~0` and `~1` tokens;
- missing values versus explicit `null`;
- recursive object subsets with extra actual properties;
- object order and JSON formatting independence;
- order-independent array subsets;
- duplicate expected elements requiring distinct actual elements;
- nested arrays and objects;
- explicit indexed pointers remaining order-sensitive;
- integer/decimal numeric equivalence;
- booleans remaining distinct from `0` and `1`;
- string, number, boolean, and null type mismatches;
- empty objects and arrays;
- invalid pointer syntax and indices.

Installed CLI scenarios prove representative passes and failures, status-only assertions, documented non-2xx behavior, assertion counts, and unmatched-only failure output. Failure output must not disclose unrelated response fields.

## 7. Ticket automation matrix

| Ticket | Installed-process evidence | Focused evidence | Completion gate |
|---:|---|---|---|
| 01 — Documented non-2xx boundary | Public outcome once invoke exists | Adapter distinguishes documented non-2xx, undocumented status, invalid schema, and transport failure | Adapter and existing Kraken tests pass |
| 02 — Installed single-API discovery | Wheel-installed config discovery, relative paths, search/describe, allowlists, JSON/pretty, streams, exits | Config parser edges where useful | Packaging smoke, Behave slice, type check, and build pass |
| 03 — Invoke documented 2xx | File/stdin, emitted request, normalized result, pre-transport validation, failure classifications | Retain domain validation coverage | Exit codes `0/2/4/5/6` and zero-request checks pass |
| 04 — Multi-API and `@o` discovery | Ordering, collisions, independent-process reuse, append-only allocation | Atomic identity and deduplication | No rebinding and cross-process continuity pass |
| 05 — Focused assertions | Status/body pass/fail, compact output, unmatched-only, negative responses | Exhaustive pointer/matcher matrix | Exit `7`, stdout routing, and matcher tables pass |
| 06 — Revalidated `@o` invoke | Cross-process invoke, identity echo, contradictory `--api`, malformed/unknown/wrong-kind/stale refs | Revalidation classifications | Exit `2/3/8` and zero-request checks pass |
| 07 — Sessions and concurrency | Context/session precedence, isolation, permissions, process fan-out | Canonical context, migrations, lock/busy/corrupt cases | Unique monotonic IDs and convergence pass |
| 08 — State inspection/recovery | `refs list/status/gc/clear`, `resolve`, tombstones, monotonic counters | Tombstone/counter invariants | Public recovery lifecycle passes |
| 09 — Immutable `@r` privacy | Cross-process immutable response refs, `--no-state`, assertion exclusion, concurrent allocation | Stored-record privacy and transaction invariants | No request bodies or response headers retained |
| 10 — Response chaining | Recursive typed substitutions, literal `@` strings, all failures before transport | Resolver recursion, pointer, kind/context errors | Request ledger proves exact substituted JSON type |
| 11 — Expiry and cleanup | Public list/resolve/gc/clear lifecycle | Injected clock just before, at, and after 24 hours | Data expires; handles never recycle |
| 12 — 50 MiB budget | Oversized invoke stays successful with `response_ref: null` and stable reason | UTF-8 byte accounting, expired-first/oldest-first eviction | Bound, order, tombstones, and reopen behavior pass |

## 8. Exploratory QA release gates

QA starts only when the gate has a runnable installed artifact and its prerequisite automated slice is green.

### Gate A — Discovery baseline after Ticket 02

Explore conventional and explicit configuration, another working directory, YAML/JSON specs, omitted/populated/empty allowlists, canonical/pretty output, help, malformed options, unknown targets, missing files, malformed documents, remote URLs, and unusual paths.

Exit when installation and discovery are usable and no defect causes wrong visibility, invalid canonical JSON, unstable exit categorization, or stream leakage.

### Gate B — Invocation and assertions after Tickets 01, 03, and 05

Explore file/stdin invocation, pre-transport request validation, connection failure, undocumented status, invalid responses, documented 4xx/5xx, status assertions, JSON Pointer escapes and indices, subset semantics, duplicate arrays, numeric equivalence, boolean separation, compact passes, and unmatched-only failures.

Exit when API behavior, transport failure, contract failure, and assertion failure cannot be confused; all invalid request journeys prove zero transport; and no high-severity response disclosure exists.

### Gate C — Operation references after Tickets 04, 06, 07, and 08

Explore multi-API collisions, deterministic ordering, independent-process reuse, changed/removed/disallowed operations, malformed/unknown/wrong-kind/wrong-context refs, session precedence/isolation, concurrent discovery, public inspection/recovery, clearing, tombstones, monotonic counters, permissions, and project-tree cleanliness.

Exit when no handle can target a different operation, every bad-reference path is pre-transport, and reference recovery is usable. Misbinding, reuse, context leakage, or unintended transport blocks release.

### Gate D — Response-reference privacy after Ticket 09

This is a mandatory checkpoint before response chaining. Explore immutable snapshots, assertion-bearing invocations, `--no-state`, concurrency, public inspection, permissions, and sentinel secrets in request bodies and response headers.

Exit when no opt-out, forbidden-data, or cross-session privacy leak remains and no response reference can resolve to another invocation.

### Gate E — Chaining and lifecycle after Tickets 10 and 11

Explore create-then-use flows across processes, recursive substitution in parameters/bodies, exact JSON types, literal reference-shaped strings, wrong kinds, escaped/missing pointers, expired/cleared/context-mismatched refs, public collection/clear commands, and non-recycled identities.

Exit when chained requests receive exactly the selected value and type, literal strings stay literal, expired data is unavailable, and every resolution failure proves zero transport.

### Gate F — Storage-budget release after Ticket 12

Explore expired-first and oldest-first eviction, surviving/evicted refs, just-below/at/above-boundary payloads, concurrent large responses, oversized-response success without persistence, bounded settled state, and the full search → `@o` invoke → `@r` chain → assertions → inspect → GC → clear journey.

Exit when all core journeys pass from a clean installed artifact, module CI is green, and no Critical or High defect remains.

## 9. QA execution and evidence standard

Before each charter, record the build identifier, commit, OS, architecture, Python version, current directory, configuration, effective state root, and session. State the expected stream, exit category, transport count, and state change before executing.

Every defect record must contain:

- exact installed commands in order, identifying separate processes;
- sanitized config, OpenAPI fixture, and initial state;
- separate raw stdout and stderr plus numeric exit code;
- parsed JSON when the canonical contract applies;
- local-server request ledger, including proof of zero requests;
- relevant public state location, permissions, reported status, and size;
- expected result tied to the specification or ADR;
- actual result, user impact, and nearest passing regression boundary;
- reproduction rate: at least 3/3 from clean state for deterministic defects; attempts, failures, process count, timing, and seed/order for concurrency defects.

A report is incomplete if it merges streams, omits an exit code, or cannot establish whether transport occurred. Evidence remains local for this feature; do not publish issues or artifacts externally.

## 10. Severity

- **Critical:** silent reference misbinding; cross-context disclosure; `--no-state` retention; forbidden request/header retention; unintended state-changing request after a pre-transport error; broad destructive state loss.
- **High:** a core search/describe/invoke/assert/chain journey is unusable; allowlist bypass; automation-breaking exit/stream drift; isolation failure; reference recycling; unenforced retention bound.
- **Medium:** supported edge failure with a safe workaround; misleading recovery status; materially confusing pretty output; poor diagnostics while automation remains safe.
- **Low:** cosmetic or wording defects that do not affect canonical JSON, streams, exits, transport, privacy, or identity.

## 11. Entry and completion criteria

A ticket enters implementation when its acceptance criteria and dependencies are stable, its required seam exists or the minimum testability seam is agreed, local fixtures can express the behavior, and prior frontier tests are green.

A ticket is complete only when:

- behavior-first tests were added where practical;
- every introduced public behavior has installed-process coverage;
- algorithms and error classifications have focused coverage;
- all earlier frontier scenarios remain green;
- tests use no external network, fixed port, arbitrary sleep, automatic retry, shared user state, or private-type assertions;
- failures expose argv, exit, separate streams, ledger, and isolated state root;
- type checking, packaging, module CI, and diff hygiene pass;
- the applicable QA gate has no unresolved blocking defect before release of that frontier.

## 12. CI and local verification

Once Ticket 02 registers Kraken with the module runner, the repository gate is:

```text
./scripts/module ci xq-kraken
git diff --check
```

Useful focused commands from the Kraken module are:

```text
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache uv run python -m unittest discover -s tests
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache uv run behave features
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache uv run basedpyright
SOURCE_DATE_EPOCH=0 UV_CACHE_DIR=/tmp/xq-kraken-uv-cache uv build
```

The package smoke must install the produced wheel into a fresh environment and execute installed `kraken`, not import code from the checkout.

These are future implementation gates. No feature tests have run as part of writing this strategy.

## 13. Flake policy

- CI performs zero automatic retries and never weakens assertions.
- An intermittent failure blocks its ticket until classified.
- Reproduce the smallest scenario repeatedly with isolated state while preserving seed, argv, process results, ledger, and state bundle.
- Replace timing assumptions with events/barriers and wall-clock dependencies with injected clocks.
- Leaked processes, shared environment, cleanup failures, and port collisions are harness defects and receive product-test priority.
- “Passed on retry” is not acceptable evidence.

## 14. Known gaps and out-of-scope coverage

- Windows state paths and ACLs remain unproven until a supported runner exists.
- Network-mounted filesystem and extreme-concurrency behavior are not release claims.
- A repeated stress lane may add SQLite scheduling confidence but must not become retry logic for required tests.
- A full 50 MiB process test runs once; fast policy permutations belong at the service seam.
- Authentication, secrets integration, custom runtime headers, remote specs, external APIs, generic HTTP verbs, daemons, UIs, simulators, and devices are outside this feature.
- QA reports any gate not yet runnable as **not tested**, never passed.
- Long-duration wall-clock expiry is not a QA requirement; deterministic SDET evidence with an injected clock is authoritative.

## 15. Release evidence summary

Final Kraken CLI release evidence must include:

- green installed-process acceptance, focused tests, type check, package build, and module CI;
- QA environment and gate report with local evidence locations;
- resolved or explicitly accepted lower-severity findings;
- explicit untested-area disclosure;
- proof of reference correctness, privacy, bounded retention, deterministic output, and absence of unintended transport.
