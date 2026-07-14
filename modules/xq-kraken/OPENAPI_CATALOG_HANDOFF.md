# OpenAPI Catalog Implementation Handoff

## Current state

The module contains the existing immutable catalog contract in
`model/api_catalog.py` and the BDD-style executable specifications in
`tests/`. The repository, extractor, ingestion service, and request builder
are intentionally not implemented.

The existing contract requires:

- `ApiCatalog` metadata, servers, and endpoints
- `ApiEndpoint.operation_id` as a required stable lookup key
- optional request body and always-present response collection
- raw OpenAPI-shaped request and response content mappings
- `ApiSource`, `ApiExtractor`, and `ApiCatalogProvider` protocols

## Recommended implementation seams

Add these modules without coupling the domain model to SQLite:

```text
extraction/openapi_catalog_extractor.py
persistence/catalog_repository.py
persistence/sqlite_catalog_repository.py
ingestion/catalog_ingestion.py
request_construction/request_builder.py
```

### Repository interface

Add a protocol with this public behavior:

```python
class ApiCatalogRepository(Protocol):
    def save(
        self,
        catalog: ApiCatalog,
        raw_document: Mapping[str, object],
    ) -> str: ...

    def get_catalog(self, document_id: str) -> ApiCatalog: ...

    def get_operation(
        self,
        document_id: str,
        operation_id: str,
    ) -> ApiEndpoint: ...
```

`SqliteApiCatalogRepository` should use a canonical hash of the raw document
as the stable document ID. Saving an unchanged document should be idempotent.
Operation lookup should query persisted operation data directly rather than
rehydrating every operation in the document.

### Extraction

`OpenApiCatalogExtractor.extract(document)` should populate metadata, servers,
HTTP operations, summaries, tags, deprecation, request bodies, and responses.
It should reject an operation without `operationId` with an explicit error.
Request and response schemas should remain raw mappings, preserving `$ref`,
`oneOf`, `allOf`, enums, and vendor extensions.

To support final request construction, extend the domain contract with an
immutable parameter model containing at least:

- name
- location (`path`, `query`, `header`, or `cookie`)
- required flag
- raw schema
- example/default/style metadata where available

The request body should preserve required status and media type → raw schema
content. Responses should preserve status code as text and media type → raw
schema content.

### Ingestion

The ingestion service should compose three dependencies:

```text
source.load → extractor.extract → repository.save
```

It should return the persisted document ID and perform no HTTP request
execution.

### Request construction

The request builder should consume a persisted `ApiEndpoint` and caller input
values, then return a prepared request containing method, URL, headers, query,
cookies, and body.

Required behavior:

- substitute required path parameters
- reject missing required path/query values
- serialize query values
- select or accept an explicit request media type
- reject a missing required body
- apply the selected base URL
- do not invent values or execute the request

## Tests

The tests in `tests/` are intentionally RED until the implementation exists.
They cover:

- catalog persistence and reload
- stable identity for repeated ingestion
- operation lookup by document ID and `operation_id`
- metadata, servers, operations, parameters, request bodies, and responses
- explicit rejection of missing `operationId`
- request construction and required-input failures
- the complete source → extract → persist → query → request flow

Run them with Python 3.14 through `uv`:

```bash
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache \
  uv run python -m unittest discover -s tests -v
```

Do not add request execution, client SDK generation, full `$ref` normalization,
or database-specific types to the domain model in this slice.
