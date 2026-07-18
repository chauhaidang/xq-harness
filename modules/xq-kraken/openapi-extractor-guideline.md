# OpenAPI Extractor Implementation Guideline

Runtime modules use the `kraken` import package, with executable specifications
under `tests`.

This document defines the v1 shape of the OpenAPI extractor planned for
`xq-kraken`. It is an implementation guide, not a source-code implementation.
The extractor turns one already-loaded OpenAPI document into an immutable
`ApiCatalog` that downstream persistence and request-construction code can
consume.

## 1. Role and data flow

The extractor owns translation. It does not own I/O, database persistence,
HTTP execution, or general OpenAPI schema compilation.

```text
source identifier/object
        │
        ▼
OpenApiSource.load
        │  loaded Mapping[str, object]
        ▼
OpenApiExtractor.extract
        │  ApiCatalog
        ├──────────────► ApiCatalogRepository.save(catalog, raw_document)
        └──────────────► request builder consumes a selected ApiEndpoint
```

The intended orchestration is:

1. An `OpenApiSource` loads a document and returns a mapping.
2. `OpenApiCatalogExtractor` validates the extraction invariants and maps the
   document into catalog models.
3. An ingestion service persists the catalog and the original document.
4. A request builder later uses a persisted endpoint and caller inputs to
   prepare a request; it does not execute that request.

Keeping these steps separate means a file, HTTP, or in-memory source can be
changed without changing extraction, and a future schema or `$ref` service can
be added without changing the catalog's public role.

## 2. Mapping an OpenAPI document into `ApiCatalog`

The extractor should accept a loaded `Mapping[str, object]` and return one
`ApiCatalog`. It should read the document defensively and fail explicitly when
an operation violates a required invariant.

| OpenAPI location | Catalog field | Mapping rule |
| --- | --- | --- |
| `info.title` | `ApiCatalog.title` | Use the string when present; otherwise `None`. |
| `info.version` | `ApiCatalog.version` | Use the string when present; otherwise `None`. |
| `info.description` | `ApiCatalog.description` | Use the string when present; otherwise `None`. |
| `servers[*].url` | `ApiCatalog.servers` | Preserve server URLs in document order as a tuple. |
| `paths` operations | `ApiCatalog.endpoints` | Emit one endpoint per supported HTTP operation, in path/document order and then operation order. |

The extractor should treat the OpenAPI operation keys as HTTP methods. The
catalog uses normalized uppercase methods (`GET`, `POST`, and so on), while
the path remains exactly as written, including template expressions such as
`/payments/{payment_id}`.

For v1, the extractor should recognize the standard HTTP operation keys:
`get`, `put`, `post`, `delete`, `options`, `head`, `patch`, and `trace`.
Other path-item keys such as `parameters`, `summary`, `description`, and
vendor extensions are not operations.

A missing `paths` object produces an empty endpoint tuple. A malformed value
where a mapping or sequence is required should result in a clear extraction
error rather than a partially populated catalog.

## 3. Catalog model responsibilities

The models describe the extracted contract; they do not parse documents or
perform transport work. Keep them immutable (the existing contract uses
frozen dataclasses and tuple collections).

### `ApiCatalog`

`ApiCatalog` is the document-level result. It contains optional API metadata,
the ordered server URL tuple, and all extracted operations. It should not hold
the source identifier, database connection, loaded source object, or a client
session.

### `ApiEndpoint`

`ApiEndpoint` is one callable HTTP operation. It owns:

- `path` and normalized `method`;
- required stable `operation_id`;
- optional `summary` and `description`;
- ordered `tags`;
- the `deprecated` flag;
- the effective parameter collection;
- an optional request body contract; and
- the response collection, which is always present even when empty.

`operation_id` is the stable caller-facing lookup key. It is not optional in
the domain model and must never be synthesized from the path and method.

### `ApiParameter`

The extractor should map each effective parameter into an immutable
`ApiParameter` containing at least:

```text
name       parameter name
location   path, query, header, or cookie
required   whether the caller must supply it
schema     raw OpenAPI-shaped schema mapping (when present)
```

The model may also retain `description`, `example`, `examples`, `default`,
`style`, `explode`, `allowEmptyValue`, and `deprecated` metadata when those
values are needed by request construction. Parameter models should describe
input requirements; serialization belongs to the request builder.

### `ApiRequestBody`

`ApiRequestBody` represents the request payload contract. It contains
`required`, optional `description`, and a mapping from media type to the raw
schema/content payload. An absent OpenAPI `requestBody` maps to
`ApiEndpoint.request_body = None`; it must not be represented by a fabricated
empty body.

### `ApiResponse`

`ApiResponse` represents one response contract. Preserve `status_code` as a
string because OpenAPI permits `default` and other non-numeric response keys.
Retain the optional description and media type → raw content mapping. The
extractor should preserve response order from the source mapping.

## 4. Metadata, servers, and paths

Read metadata only from the document's `info` mapping. Missing optional values
become `None`; do not infer a title or version from a filename or URL.

For each server object, read its `url`. The v1 catalog stores server URLs as
strings, so server variables are not expanded by the extractor. A consumer
that needs a concrete server can select a URL and resolve variables as a
separate concern. Preserve source order and do not silently choose a server
inside the extractor.

Walk `paths` without flattening path-level metadata into unrelated operations.
The path string is the endpoint template and remains suitable for later
substitution by the request builder.

## 5. Operations and required `operationId`

For every supported operation:

1. Read `operationId`.
2. Reject the document if it is absent, empty, or not a usable string.
3. Copy `summary`, `description`, `tags`, and `deprecated` with their
   documented defaults.
4. Resolve effective parameters using the precedence rule below.
5. Map `requestBody` and `responses`.

The error must identify the invariant and the operation context. At minimum,
raise `ValueError` with a message containing `Missing operationId` for an
operation without the field. Do not generate IDs such as `get_/payments`:
stable lookup, persistence, and request selection all depend on the source
operation ID.

`tags` defaults to an empty tuple, and `deprecated` defaults to `False`.
`responses` defaults to an empty tuple in the model, although a strict
OpenAPI validator may separately require a responses object. Full spec
validation is outside this extractor's v1 responsibility.

## 6. Parameter precedence and normalization

OpenAPI permits parameters on both a path item and an operation. The effective
parameter set for one operation is calculated as follows:

1. Start with path-level parameters.
2. Apply operation-level parameters in source order.
3. When both have the same `(name, in)` pair, the operation-level parameter
   replaces the path-level parameter.
4. Keep distinct locations separate: `id` in `query` does not replace `id` in
   `path`.
5. Preserve the resulting deterministic order, normally the path-level order
   followed by operation-level additions/replacements.

This is replacement, not concatenation. A path-level parameter overridden by
an operation must occur only once in the endpoint. Parameter `$ref` entries
may be retained as raw references or rejected as unsupported according to the
chosen adapter boundary; they must not be guessed at by silently merging
incomplete data.

Only `path`, `query`, `header`, and `cookie` locations belong in the v1
parameter model. A path parameter is required by OpenAPI; preserve the source
flag and let validation report a contradictory document if necessary.

Example:

```yaml
paths:
  /payments/{payment_id}:
    parameters:
      - name: payment_id
        in: path
        required: true
        schema: {type: string}
      - name: trace
        in: header
        schema: {type: string}
    get:
      operationId: getPayment
      parameters:
        - name: trace
          in: header
          required: true
          schema: {type: string}
        - name: expand
          in: query
          schema: {type: boolean}
```

The endpoint receives `payment_id`, the operation-level required `trace`, and
`expand`; it does not receive two `trace` parameters.

## 7. Request bodies and responses

For a request body, preserve:

- `required` (default `False`);
- `description` (default `None`); and
- each content media type and its raw payload, especially its `schema`.

The content mapping should retain the complete OpenAPI-shaped value so vendor
extensions, examples, encoding metadata, and `$ref` values are not lost. A
request builder can later select `application/json` or an explicitly chosen
media type; selection is not extraction.

For each response, preserve the status key as text, description, and content
media type mappings. A response without content remains an `ApiResponse` with
an empty content mapping. Do not discard `default`, wildcard-like extension
keys, or response headers merely because v1 does not yet expose a dedicated
header model; preserve raw content where the model supports it and document
any intentionally unsupported field.

## 8. Raw schema preservation

Request and response schemas remain raw OpenAPI-shaped mappings in v1. The
extractor must preserve, without normalization or mutation:

- `$ref` references;
- `oneOf`, `allOf`, and `anyOf` branches;
- arrays, enums, formats, nullable/read-only/write-only flags;
- recursive structures; and
- vendor extensions such as `x-*` fields.

Do not convert schemas into a custom Python AST, resolve references while
extracting, or reduce a schema to only `type` and `properties`. If defensive
copies are needed to prevent later mutation, copy the mapping while retaining
its original shape. The persisted raw document should remain available beside
the catalog for consumers that need fields not represented by the v1 models.

## 9. Keep adjacent responsibilities separate

The following boundaries are intentional:

| Responsibility | Owns | Does not own |
| --- | --- | --- |
| Loading | Reading/parsing a source into a mapping | Catalog models, persistence, HTTP execution |
| Extraction | Mapping document fields and enforcing `operationId` | Network/file I/O, database writes, `$ref` graph resolution |
| Persistence | Stable document identity, saving/reloading catalog and raw document, operation lookup | OpenAPI parsing policy, request execution |
| Request construction | Substituting inputs, serializing values, selecting base URL/media type, preparing method/URL/headers/query/body | Sending requests, schema compilation |
| `$ref` resolution | A future explicit resolver/service | Hidden mutation of extractor output |

In particular, an ingestion service should compose
`source.load → extractor.extract → repository.save` and return a document ID.
It should not make an API call. A request builder should return a prepared
request and leave execution to its caller.

## 10. Recommended private-helper structure

Keep the public extractor small and make each mapping rule testable through
private helpers. A recommended shape is:

```text
OpenApiCatalogExtractor.extract(document)
├── _read_info(document) -> catalog metadata
├── _read_servers(document) -> tuple[str, ...]
├── _extract_paths(document["paths"])
│   ├── _is_operation_key(key)
│   ├── _extract_operation(path, method, path_item, operation)
│   │   ├── _require_operation_id(operation, path, method)
│   │   ├── _merge_parameters(path_item, operation)
│   │   ├── _map_parameter(parameter)
│   │   ├── _map_request_body(operation.get("requestBody"))
│   │   └── _map_responses(operation.get("responses"))
│   └── _map_raw_content(value)
└── _as_mapping(value, context)
```

These helpers should return domain values or raw mappings, not source-adapter
objects. Avoid putting parsing helpers on `ApiCatalog` or `ApiEndpoint`; that
would make the domain model aware of OpenAPI document layout and make future
input formats harder to support.

## 11. Representative input and output

Input:

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Payments API",
    "version": "1.0.0",
    "description": "Payment operations"
  },
  "servers": [{"url": "https://api.example.test/v1"}],
  "paths": {
    "/payments/{payment_id}": {
      "parameters": [{
        "name": "payment_id",
        "in": "path",
        "required": true,
        "schema": {"type": "string"}
      }],
      "post": {
        "operationId": "updatePayment",
        "summary": "Update a payment",
        "tags": ["payments"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/PaymentUpdate"}
            }
          }
        },
        "responses": {
          "200": {
            "description": "Updated",
            "content": {"application/json": {
              "schema": {"$ref": "#/components/schemas/Payment"}
            }}
          },
          "default": {"description": "Unexpected error"}
        }
      }
    }
  }
}
```

The corresponding catalog shape is conceptually:

```python
ApiCatalog(
    title="Payments API",
    version="1.0.0",
    description="Payment operations",
    servers=("https://api.example.test/v1",),
    endpoints=(
        ApiEndpoint(
            path="/payments/{payment_id}",
            method="POST",
            operation_id="updatePayment",
            summary="Update a payment",
            tags=("payments",),
            parameters=(
                ApiParameter(
                    name="payment_id",
                    location="path",
                    required=True,
                    schema={"type": "string"},
                ),
            ),
            request_body=ApiRequestBody(
                required=True,
                content={"application/json": {
                    "schema": {"$ref": "#/components/schemas/PaymentUpdate"}
                }},
            ),
            responses=(
                ApiResponse(
                    status_code="200",
                    description="Updated",
                    content={"application/json": {
                        "schema": {"$ref": "#/components/schemas/Payment"}
                    }},
                ),
                ApiResponse(status_code="default", description="Unexpected error"),
            ),
        ),
    ),
)
```

The `$ref` strings remain unchanged. The extractor does not need to know what
`PaymentUpdate` or `Payment` contains.

## 12. Test cases and verification

Tests should cover the public behavior, not private helper names. At minimum,
add or retain cases for:

- metadata and server URL extraction;
- one endpoint per supported operation and uppercase method normalization;
- summary, description, tags, and deprecation;
- path-level parameters inherited by an operation;
- operation-level replacement of a same-name/same-location path parameter;
- distinct same-name parameters in different locations;
- required and optional parameters with raw schemas and metadata;
- absent and required request bodies, multiple media types, and raw `$ref`;
- numeric and `default` response status codes, descriptions, and content;
- explicit rejection of missing or empty `operationId`;
- preservation of `oneOf`, `allOf`, enums, extensions, and recursive `$ref` data;
- the source → extract → persist → query → request-construction flow; and
- the guarantee that extraction and ingestion perform no HTTP request.

Run the focused extractor tests while developing, then the complete module
suite:

```bash
cd modules/xq-kraken
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache uv run behave features
```

From the repository root, also run the startup verification and a whitespace
check:

```bash
./init.sh
git diff --check
```

Because this guideline intentionally adds no implementation, RED tests in the
current handoff are expected until the extractor slice is built. Documentation
verification should still confirm that examples, field names, and commands
match the contract and test fixtures.

## 13. v1 non-goals and design assumptions

The v1 extractor assumes a loaded, mapping-shaped OpenAPI document and an
immutable catalog boundary. It does not attempt to:

- validate every rule of the OpenAPI specification;
- resolve every local or remote `$ref`;
- normalize schemas into custom Python classes;
- generate client SDKs or request executors;
- execute HTTP requests;
- persist directly from the extractor;
- couple catalog models to SQLite or another database; or
- expand server variables or invent missing parameter values.

These are deliberate seams for later work. A future resolver, validator,
source adapter, repository, or request executor can be introduced behind its
own interface while the extractor remains responsible for one clear job:
faithfully mapping an OpenAPI document into the `ApiCatalog` contract.
