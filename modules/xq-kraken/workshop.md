# XQ Kraken Workshop: Build a Small OpenAPI Client

This guide is for a Python developer who is comfortable reading functions and
classes, but is new to OpenAPI clients. You will build a synchronous client
that lets a CLI or an LLM do three things:

1. find allowed operations;
2. inspect the inputs an operation needs; and
3. invoke an allowed operation safely.

The client is deliberately small. It is not an OpenAPI implementation and it
does not use a separately generated SDK. `aiopenapi3` parses the specification
at runtime, resolves its OpenAPI machinery, creates runtime Pydantic
request/response types, and executes requests. Kraken adds product policy: an
allowlist, a simple discovery workflow, safe errors, and plain Python output.

```text
CLI or LLM
    │ search / describe / invoke
    ▼
KrakenDynamicClient       ← allowlist, compact catalog, plain DTOs
    ├── describe ────────→ raw input schema from the owned OpenAPI document
    ▼
aiopenapi3.OpenAPI        ← same document: parsing, validation, transport
```

## Before you start

From the module root, install the locked dependencies and run the existing
functional tests:

```bash
cd modules/xq-kraken
uv sync --locked
uv run behave features
```

The workshop specification is
[`tests/fixtures/widgets-openapi.yaml`](tests/fixtures/widgets-openapi.yaml).
It contains exactly three operations:

| Operation ID | HTTP request | Purpose |
| --- | --- | --- |
| `listWidgets` | `GET /widgets` | List widgets, optionally with `limit` |
| `getWidget` | `GET /widgets/{widgetId}` | Get one widget |
| `createWidget` | `POST /widgets` | Create one widget |

Never replace this fixture with a specification from another service while
working through the exercises. It makes failures harder to understand.

## How the exercises work

The executable requirements live in
[`workshop/features/checkpoints.feature`](workshop/features/checkpoints.feature).
Each checkpoint has a tag. Run one tag at a time:

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint1
```

Read the error, make the smallest change that explains the error, and rerun the
same command. Do not run later checkpoint tags until the current one is green.
The checkpoint Python files are the detailed assertions behind the Gherkin
sentences. For example, checkpoint 1 is
[`workshop/checkpoint_1.py`](workshop/checkpoint_1.py).

## Project map

```text
kraken/
  models.py          values callers receive or pass to the client
  errors.py          safe exceptions callers can handle
  client.py          small KrakenClient Protocol
  dynamic_client.py  current aiopenapi3 implementation
tests/
  fixtures/widgets-openapi.yaml  project-owned teaching specification
workshop/
  features/          Behave checkpoint scenarios
  checkpoint_*.py    assertion bodies used by those scenarios
```

`KrakenDynamicClient` is the only implementation today. Keep the small
`Protocol` only as a future-adapter seam: a cached, remote, or different-parser
client might later preserve the same CLI/LLM workflow. It does **not** mean
that this workshop needs a generated SDK or an additional catalog service.
Do not introduce an abstract base class, fake adapter, repository, or a second
catalog layer just to accompany the protocol. KISS here means one narrow
abstraction—not copying the entire OpenAPI object model.

## The KrakenClient contract

The protocol describes what callers can do, not how OpenAPI is parsed:

```python
class KrakenClient(Protocol):
    def search(self, query: str) -> tuple[OperationSummary, ...]: ...

    def describe(self, operation_id: str) -> OperationDescription: ...

    def invoke(self, request: InvocationRequest) -> InvocationResult: ...
```

Keep `client.py` free of YAML, HTTPX, `aiopenapi3`, configuration, and factory
types. It imports only public DTOs. A concrete implementation does not need to
inherit from `KrakenClient`; structural typing is enough.

The contract promises that search returns deterministic visible operations,
describe and invoke enforce the same allowlist, callers receive Kraken DTOs and
safe errors, and requests are validated before transport.

### Constructing a client is separate

Do not put `from_file`, provider selection, or configuration on `KrakenClient`.
Those are construction concerns. A CLI composition root can choose an
implementation and return the protocol type:

```python
def build_client(config: KrakenConfig) -> KrakenClient:
    if config.provider == "openapi":
        return KrakenDynamicClient.from_file(...)
    raise ValueError(f"Unsupported provider: {config.provider}")
```

When a future provider appears, add it to this factory. Do not make every
caller branch on the provider.

### Evolving the contract

Add a method only when every implementation can offer the same useful caller
behavior. Avoid parser-shaped methods such as `raw_spec`, `get_schema`, or
`list_tags`. Preserve method meanings and error categories. If a future change needs
incompatible behavior, such as async streaming or a different pagination
result, add a capability or `KrakenClientV2` rather than silently changing the
three methods above.

## Vocabulary

An **operation** is one HTTP action in an OpenAPI document. `operationId` is
its stable name, such as `getWidget`.

An **allowlist** is the set of operation IDs Kraken is permitted to show or
call. It is policy, not an OpenAPI feature.

A **DTO** is a small immutable dataclass that crosses the Kraken boundary. For
example, `OperationSummary` contains only an ID, summary, and tags. It does
not expose `aiopenapi3` objects.

A **mapping** is a dictionary-like object. OpenAPI YAML becomes nested mappings
and lists when loaded. Treat that representation as input data; do not build a
second complete parser for it.

## How an LLM knows what payload to send from OpenAPI automatically

The owned OpenAPI document is the single source of truth for both discovery and
execution. Kraken loads it once in `from_file` and uses it in two ways:

1. `_index_operations` retains the selected operation's metadata and its raw
   OpenAPI parameter/body schemas for `describe`.
2. `aiopenapi3.OpenAPI` receives the same document and creates the runtime
   request object that validates parameters, serializes the request, sends HTTP,
   and parses the response. Kraken constructs that runtime request's generated
   Pydantic body model before invoking it.

There is no hand-written DTO mapper, generated-wheel manifest, or per-operation
field list. The keys the LLM sends are the OpenAPI wire names that `describe`
showed it. For example, `widgetId` remains `widgetId` and `quantity` remains
`quantity`.

The LLM must not read the complete YAML before every call. It learns one
operation at a time through a progressive workflow:

```text
search("widget") → choose an operation ID
describe(operation ID) → learn only that operation's required inputs
invoke(request) → send values matching the described inputs
```

### 1. Search returns a small menu

Search should return only allowed operation IDs and short summaries. Do not put
schemas, response bodies, headers, components, or complete paths in this
response unless a caller explicitly asks for debugging detail.

```json
{
  "operations": [
    {"id": "createWidget", "summary": "Create a widget"},
    {"id": "getWidget", "summary": "Get a widget"},
    {"id": "listWidgets", "summary": "List widgets"}
  ]
}
```

This is much smaller than an OpenAPI document because the agent sees a menu,
not every schema and every endpoint.

### 2. Describe returns one callable input contract

After selecting `createWidget`, the agent asks `describe("createWidget")`.
Kraken returns only the parameters and body required to construct that request:

```json
{
  "id": "createWidget",
  "summary": "Create a widget",
  "input": {
    "parameters": [],
    "body": {
      "required": true,
      "content_type": "application/json",
      "schema": {
        "type": "object",
        "required": ["name", "quantity"],
        "properties": {
          "name": {"type": "string", "minLength": 1},
          "quantity": {"type": "integer", "minimum": 1}
        }
      }
    }
  }
}
```

For `getWidget`, there is no body. The description instead exposes its required
path parameter:

```json
{
  "id": "getWidget",
  "input": {
    "parameters": [
      {
        "name": "widgetId",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "minLength": 1}
      }
    ]
  }
}
```

The agent now has enough information to build a payload. The `schema` value is
the OpenAPI schema from the selected operation; it is not a Kraken-specific
copy of the fields. It does not need the other two operations, unrelated
components, server configuration, or response schemas it cannot act on yet.

For an LLM framework that accepts JSON Schema tool definitions, the CLI adapter
can wrap this exact selected input contract in an outer object with
`parameters` and `body`. That is a presentation conversion, not a second
schema source:

```json
{
  "type": "object",
  "properties": {
    "parameters": {"type": "object"},
    "body": {
      "type": "object",
      "required": ["name", "quantity"],
      "properties": {
        "name": {"type": "string", "minLength": 1},
        "quantity": {"type": "integer", "minimum": 1}
      }
    }
  },
  "required": ["body"]
}
```

The wrapper tells the model where values go; the nested schema tells it how to
construct the body. Kraken still receives the ordinary `InvocationRequest`
envelope below and the dynamic OpenAPI client remains the executor.

### 3. Invoke accepts a simple envelope

For a body operation, the agent sends values under `body`:

```json
{
  "operation_id": "createWidget",
  "body": {"name": "Keyboard", "quantity": 2}
}
```

For a parameter operation, it sends values under `parameters`:

```json
{
  "operation_id": "getWidget",
  "parameters": {"widgetId": "widget-1"}
}
```

Kraken first uses the selected runtime request's generated Pydantic model to
validate a non-empty JSON body. It then passes the OpenAPI-named parameters and
validated body to the runtime request, which serializes and sends it. If a
required field is absent or `quantity` is `0`, Kraken raises
`InvocationValidationError` with the safe message `Invocation input is
invalid`; the original library error remains the exception cause for local
debugging. The caller can re-describe the operation, correct the payload, and
invoke again. It never has to infer the full YAML document.

### Output-size rule

Kraken is **not OpenAPI rendered as JSON**. Keep each command bounded:

| Command | Return by default | Omit by default |
| --- | --- | --- |
| `search` | ID and short summary | schemas, all responses, components, headers |
| `describe` | one operation's inputs and optional success shape | other operations and unrelated components |
| `invoke` | `ok`, status, and bounded response data | request headers, credentials, unbounded lists, parser objects |

For a tiny three-operation teaching specification, token savings are modest.
For a real API with dozens or hundreds of operations, this staged lookup avoids
putting the complete catalog into the LLM context and can reduce discovery
context by an order of magnitude. The saving comes from selecting one operation
before showing its input schema—not merely from converting YAML to JSON.

Do not silently truncate the selected operation's callable input schema: that
would make the LLM guess fields. The workshop fixture keeps schemas inline. For
a production specification that uses `$ref` or a very large schema, expose the
referenced subtree or add an explicit follow-up schema lookup; preserve enough
of the selected contract for the caller to construct a valid request. Add
pagination, field projection, maximum items, or maximum response bytes before
returning large **invoke** results.

## Checkpoint 0: read the boundary first

Read [`kraken/models.py`](kraken/models.py), [`kraken/errors.py`](kraken/errors.py),
and [`kraken/client.py`](kraken/client.py) before changing behavior. Notice
these choices:

- DTOs use `@dataclass(frozen=True)`, so a caller cannot mutate a result after
  receiving it.
- `InvocationRequest.parameters` defaults to an empty mapping, so callers do
  not need to write `parameters={}` for operations without parameters.
- Kraken exceptions carry an operation ID and a safe message. They must not
  leak request headers, credentials, or Pydantic internals.
- The protocol has exactly three caller actions. A fake can be useful for the
  checkpoint, but it is a teaching aid rather than a production layer.

You normally start implementation at checkpoint 1:

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint1
```

## Checkpoint 1: load and list operations

### Goal

Implement `KrakenDynamicClient.from_file(...)` and `search(query)`. At the end,
the client can load the Widgets specification and return only allowlisted
`OperationSummary` objects.

### What to create

Create `kraken/dynamic_client.py` with one class:

```python
class KrakenDynamicClient:
    @classmethod
    def from_file(
        cls,
        *,
        spec_path: Path,
        base_url: str,
        allowed_operation_ids: set[str],
    ) -> "KrakenDynamicClient":
        ...

    def search(self, query: str) -> tuple[OperationSummary, ...]:
        ...
```

### Step 1: load the YAML safely

`yaml.safe_load` returns Python values. The root must be a dictionary; reject
anything else with a clear `ValueError`.

```python
loaded = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
if not isinstance(loaded, dict):
    raise ValueError("OpenAPI document must be a mapping")
```

### Step 2: validate operation IDs before filtering

Walk `document["paths"]`. An HTTP method is one of `get`, `post`, `put`,
`patch`, `delete`, `head`, `options`, or `trace`. Ignore path-item fields such
as `parameters`.

For each HTTP operation, require a non-empty string `operationId`, and reject a
duplicate. Do this for *every* operation, even one not in the allowlist. A
hidden broken operation is still a broken contract.

```python
if not isinstance(operation_id, str) or not operation_id.strip():
    raise ValueError("Every HTTP operation requires a non-empty operationId")
if operation_id in operations:
    raise ValueError(f"Duplicate operationId: {operation_id}")
```

Keep only the small metadata needed later: ID, HTTP method, path, path-level
parameters, and the operation descriptor. This is an index, not another full
OpenAPI parser.

### Step 3: construct the private parser

Copy the document, replace `servers` with the caller's `base_url`, then create
the synchronous `aiopenapi3.OpenAPI` instance. Keep it in `self._api`. Do not
return it to callers.

```python
transport_document = copy.deepcopy(document)
transport_document["servers"] = [{"url": base_url}]
api = OpenAPI(
    spec_path.resolve().as_uri(),
    transport_document,
    session_factory=httpx.Client,
    use_operation_tags=False,
)
```

`use_operation_tags=False` keeps `operationId` as the lookup key. This matters
because the workshop and an LLM use names such as `getWidget`, not generated
Python attribute paths.

### Step 4: implement search

Create an `OperationSummary` only for IDs in the allowlist. For an empty query,
return every visible operation. For a non-empty query, compare case-insensitively
against the operation ID, summary, and tags. Sort by `operation_id` so results
are predictable.

```python
haystack = " ".join((item.operation_id, item.summary or "", *item.tags)).casefold()
if query.casefold() in haystack:
    matches.append(item)
return tuple(sorted(matches, key=lambda item: item.operation_id))
```

### Green condition

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint1
```

You should see three passing scenarios: one successful index and two validation
failures (missing and duplicate `operationId`).

## Checkpoint 2: describe an operation

### Goal

Implement `describe(operation_id) -> OperationDescription`. A caller should be
able to discover the inputs before attempting a request.

### What belongs in a description

- operation ID, uppercase/lowercase method as your DTO defines it, and path;
- summary, description, and tags;
- parameters: name, location (`path`, `query`, `header`, or `cookie`), whether
  required, description, and raw schema;
- optional request body: required flag, description, and media-type content;
- response status codes, descriptions, and media-type content.

Start by finding the indexed operation. If it does not exist, raise
`OperationNotFoundError`. Do not return `None`: an unknown operation is a
caller error with a useful recovery path—search first.

OpenAPI permits parameters at both the path and operation level. Merge them by
`(name, in)`: operation-level definitions replace path-level definitions with
the same key. A `path` parameter is always required, even if YAML says
otherwise. This is how `describe` gives the LLM one unambiguous input contract
and how the eventual request must be interpreted.

Keep schemas as raw mappings. Kraken is not a JSON-Schema implementation.

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint2
```

## Checkpoint 3: apply visibility in one place

### Goal

Search, describe, and invoke must agree about what a caller may access.

Write one private helper, conceptually:

```python
def _require_visible(self, operation_id: str) -> IndexedOperation:
    operation = self._operations.get(operation_id)
    if operation is None:
        raise OperationNotFoundError(operation_id, "Operation not found")
    if operation_id not in self._allowed_operation_ids:
        raise OperationNotAllowedError(operation_id, "Operation is not allowed")
    return operation
```

Use it from `describe` and `invoke`. `search` filters rather than raises. The
distinction matters:

- unknown ID → `OperationNotFoundError`;
- known but hidden ID → `OperationNotAllowedError`.

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint3
```

## Checkpoint 4: invoke and normalize

### Goal

Use the private parser to turn an operation ID and `InvocationRequest` into an
HTTP request, then return only plain Kraken data.

1. Call `_require_visible` before any network work.
2. Resolve the internal request with `self._api.createRequest(operation_id)`.
3. Validate a non-empty `InvocationRequest.body` with the runtime request's
   generated Pydantic body model. Pass that model and
   `InvocationRequest.parameters` to the request using the exact OpenAPI names
   returned by `describe`.
4. Let aiopenapi3 validate/serialize the request and execute the transport.
5. Read the HTTP status and response headers.
6. Convert runtime Pydantic output recursively using `model_dump(mode="json")`.

The important ownership rule is: `describe` exposes the contract and the
runtime OpenAPI request enforces it. Kraken coordinates those two uses of one
specification; its only body-validation step is to instantiate the Pydantic
model generated by that runtime request, not to recreate field rules.

Invalid input must fail before the local test server receives a request. Catch
library exceptions at this one adapter seam and raise safe Kraken exceptions
with the original exception as the cause.

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint4
```

## Checkpoint 5: complete the caller flow

This is the behavior an LLM integration uses:

```text
search("widget")
  → choose operation ID
describe(operation ID)
  → learn required parameters/body schema
invoke(InvocationRequest(...))
  → receive plain InvocationResult
```

Translate failures into these categories:

- invalid caller input → `InvocationValidationError`;
- network/transport failure → `InvocationTransportError`;
- non-success HTTP response → `InvocationHttpError`;
- response does not satisfy the declared schema → `InvocationResponseError`.

```bash
uv run behave workshop/features/checkpoints.feature --tags=checkpoint5
```

## Troubleshooting

| Symptom | Likely cause | First check |
| --- | --- | --- |
| `ModuleNotFoundError` | Module not created or wrong import | File is under `kraken/` and imports use `from kraken...` |
| Missing `operationId` error | Fixture intentionally malformed by scenario | Validate before allowlist filtering |
| Hidden operation is still describable | Visibility check is not shared | Route describe/invoke through `_require_visible` |
| Server received an invalid body | Validation happens after transport | Validate Pydantic body before `request.request(...)` |
| Parser/Pydantic object reaches caller | Adapter is leaking implementation details | Normalize to DTOs, mappings, lists, and primitives |

## Final verification

Run these only after every checkpoint is green:

```bash
uv run behave features
uv run behave workshop/features/checkpoints.feature
uv run python -m unittest discover -s tests -p 'test_*.py' -v
uv run basedpyright
uv build
```
