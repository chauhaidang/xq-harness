# API Catalog Contract

## Purpose

This module defines the contract for a service that:

1. loads an OpenAPI document from some source
2. extracts API information from that document
3. returns a normalized API catalog

The contract is intentionally split between:

- domain data models
- source and extraction protocols
- one orchestration service interface

## Design Goals

- keep the domain model stable
- keep loading and parsing replaceable
- avoid coupling business code to one storage or transport mechanism
- preserve enough schema detail for downstream consumers
- keep v1 simple and implementable

## Domain Model

### `ApiCatalog`

Represents the extracted API surface from one OpenAPI document.

Suggested fields:

- `title: str | None`
- `version: str | None`
- `description: str | None`
- `servers: tuple[str, ...]`
- `endpoints: tuple[ApiEndpoint, ...]`

### `ApiEndpoint`

Represents one HTTP operation.

Suggested fields:

- `path: str`
- `method: str`
- `operation_id: str`
- `summary: str | None`
- `description: str | None`
- `tags: tuple[str, ...]`
- `deprecated: bool`
- `request_body: ApiRequestBody | None`
- `responses: tuple[ApiResponse, ...]`

`operation_id` is required. If the source document does not provide one, extraction must fail with an explicit error because downstream callers use it as the stable lookup key.

`request_body` must exist in the model even when absent in the source document. In that case it is `None`.

### `ApiRequestBody`

Represents the request payload contract for an endpoint.

Suggested fields:

- `required: bool`
- `description: str | None`
- `content: Mapping[str, object]`

`content` maps media type to schema payload, for example `application/json`.

### `ApiResponse`

Represents one response contract for an endpoint.

Suggested fields:

- `status_code: str`
- `description: str | None`
- `content: Mapping[str, object]`

`status_code` stays as `str` because OpenAPI responses may use values like `default`, not only numeric codes.

## Schema Representation

### Finalized v1 decision

Request and response schemas are part of the contract, but they are stored as raw OpenAPI-shaped mappings in v1.

That means:

- no custom Python schema AST yet
- no full `$ref` resolution engine in the domain model
- no attempt to normalize `oneOf`, `allOf`, `anyOf`, arrays, enums, recursion, or discriminators into custom classes

This keeps the contract practical. OpenAPI schema normalization is a separate problem and should not be hidden inside the first version of the catalog model.

### Why this is the right boundary

- the crawler service still exposes request and response schema information
- downstream code can inspect original schema details without data loss
- the extractor stays focused on catalog extraction, not schema compilation
- a future schema-normalization layer can be added without breaking the source contract

## Protocols

### `OpenApiSource`

Responsible only for loading an OpenAPI document.

Contract:

- input: a source identifier or source object
- output: a loaded OpenAPI document as a mapping

Conceptual signature:

```python
class OpenApiSource(Protocol):
    def load(self, source: object) -> Mapping[str, object]: ...
```

Examples of implementations:

- HTTP source
- file source
- in-memory source

### `OpenApiExtractor`

Responsible only for transforming a loaded OpenAPI document into the domain model.

Contract:

- input: loaded OpenAPI document
- output: `ApiCatalog`

Conceptual signature:

```python
class OpenApiExtractor(Protocol):
    def extract(self, document: Mapping[str, object]) -> ApiCatalog: ...
```

### `ApiCatalogProvider`

Public service boundary used by the application.

Contract:

- input: source identifier or source object
- output: `ApiCatalog`

Conceptual signature:

```python
class ApiCatalogProvider(Protocol):
    def get_catalog(self, source: object) -> ApiCatalog: ...
```

## Service Composition

Concrete orchestration should be implemented by a service that depends on both protocols.

Conceptual shape:

```python
class OpenApiCatalogService(ApiCatalogProvider):
    def __init__(
        self,
        source_loader: OpenApiSource,
        extractor: OpenApiExtractor,
    ) -> None: ...

    def get_catalog(self, source: object) -> ApiCatalog: ...
```

Responsibilities:

1. load the document
2. pass it to the extractor
3. return the resulting catalog

This keeps I/O concerns separate from parsing concerns.

## Non-Goals for v1

- validating the OpenAPI document against the full spec
- resolving every `$ref`
- flattening schemas into custom Python schema classes
- generating client SDKs
- generating request executors

## Implementation Guidance

- use immutable dataclasses for domain models
- use `Protocol` for behavioral contracts
- keep parsing helpers out of the domain model
- let adapters raise explicit errors for invalid or unsupported input
- keep transport-specific details out of `ApiCatalog` and `ApiEndpoint`

## File Ownership Suggestion

- `kraken/api_catalog.py`: domain models and public protocols
- future source adapter module: OpenAPI loading implementations
- future extractor module: OpenAPI-to-domain transformation
- future service module: orchestration

## Final Contract Summary

The finalized contract is:

- `ApiCatalog` contains catalog metadata and endpoints
- `ApiEndpoint` always models request and response contracts
- `operation_id` is required and acts as the stable caller-facing query key
- `request_body` may be `None`
- `responses` is always present and may be empty
- request and response schemas are stored as raw OpenAPI-shaped mappings in v1
- `OpenApiSource` loads documents
- `OpenApiExtractor` extracts domain data
- `ApiCatalogProvider` is the application-facing interface
- `OpenApiCatalogService` composes loading and extraction
