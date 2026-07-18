# aiopenapi3 cheat sheet

`aiopenapi3` is Kraken's **runtime OpenAPI interpreter**. It validates,
serializes, sends, and parses requests. Kraken separately keeps the raw OpenAPI
mapping for its catalog and LLM-facing schema descriptions.

This project pins `aiopenapi3==0.10.0`.

## Keep the two representations separate

```text
widgets-openapi.yaml
    |
    +--> yaml.safe_load(...) --> dict --> Kraken search / describe
    |
    +--> OpenAPI(...) --------> OpenAPI client --> Kraken invoke
```

`OpenAPI.load_file()` also loads a local document, but it returns an
`OpenAPI` object, not a `dict`.

```python
from pathlib import Path

import httpx
import yaml
from aiopenapi3 import OpenAPI

spec_path = Path("tests/fixtures/widgets-openapi.yaml")
document = yaml.safe_load(spec_path.read_text(encoding="utf-8"))

if not isinstance(document, dict):
    raise ValueError("OpenAPI document must be an object")

api = OpenAPI(
    spec_path.resolve().as_uri(),
    document,
    session_factory=httpx.Client,
    use_operation_tags=False,
)
```

The raw `document` is the source for `search()` and `describe()`. Do not ask an
LLM to infer an input schema from a generated Python DTO or from aiopenapi3's
private objects.

## Raw OpenAPI mapping: fields to use

Top-level fields differ slightly by OpenAPI version. The fields relevant to
Kraken are:

```python
document["openapi"]       # e.g. "3.1.0"
document["info"]          # title, version, description
document["servers"]       # server URL templates
document["paths"]         # endpoint definitions
document["components"]    # reusable schemas, parameters, responses, security
document["security"]      # global authentication requirement
document["tags"]          # catalog grouping metadata
```

A path item can contain inherited parameters plus HTTP methods:

```python
path_item = document["paths"]["/widgets/{widgetId}"]
path_parameters = path_item.get("parameters", [])
operation = path_item["get"]
```

An operation commonly contains:

```python
operation["operationId"]
operation.get("summary")
operation.get("description")
operation.get("tags", [])
operation.get("parameters", [])
operation.get("requestBody")
operation.get("responses", {})
operation.get("security")
operation.get("deprecated", False)
```

### Where an operation's input schema lives

```python
# Path, query, header, and cookie values.
parameters = [*path_parameters, *operation.get("parameters", [])]

# JSON request-body schema.
body_schema = (
    operation["requestBody"]
    ["content"]["application/json"]
    ["schema"]
)
```

Each parameter has fields such as:

```python
{
    "name": "widgetId",       # wire name the caller sends
    "in": "path",             # path | query | header | cookie
    "required": True,
    "description": "...",
    "schema": {"type": "integer"},
}
```

Path parameters are always required. If path-level and operation-level
parameters have the same `(name, in)` pair, the operation-level definition
overrides the path-level one.

## aiopenapi3's loaded object

The library parses the mapping into version-specific Pydantic models and builds
an operation index. With the project's OpenAPI 3.1 fixture, the internal root
model has these fields:

```python
api._root.openapi
api._root.info
api._root.jsonSchemaDialect
api._root.servers
api._root.paths
api._root.webhooks
api._root.components
api._root.security
api._root.tags
api._root.externalDocs
api._root.extensions
```

`_root` is private. Its name and precise model type may change across library
or OpenAPI versions, so it must remain inside `KrakenDynamicClient`; it is not
a Kraken public interface.

For exploratory, read-only inspection in a REPL:

```python
root_type = type(api._root)
print(root_type.model_fields.keys())
print(vars(api._).keys())
```

Do not use this introspection as production catalog code. Use the raw mapping
instead.

## Operation lookup and invocation

`api._` is aiopenapi3's operation index. It locates a request builder by
`operationId`:

```python
request = api._["getWidget"]
```

The resulting request object exposes `parameters` for inspecting the runtime
parameter types and `request(...)` for transport:

```python
response = request.request(
    parameters={"path": {"widgetId": 42}},
    data=None,
)
```

Kraken should first apply its allowlist, validate the LLM-provided values
against the raw OpenAPI schema, then delegate serialization and HTTP work to
aiopenapi3. The exact `parameters` and `data` shapes should be proven against
the owned Widgets fixture in Behave scenarios before being exposed as a public
CLI contract.

## Loaders and `$ref`

`OpenAPI.load_file()` reads a local YAML/JSON document. Its optional `loader`
resolves referenced documents, which is important for multi-file specs.

```python
from aiopenapi3 import FileSystemLoader, OpenAPI

api = OpenAPI.load_file(
    url="https://example.test/openapi.yaml",
    path=Path("openapi.yaml"),
    loader=FileSystemLoader(Path(".")),
    session_factory=httpx.Client,
    use_operation_tags=False,
)
```

The `url` is the base used to build request URLs; it is not merely the local
file path. In Kraken, constructing `OpenAPI` directly after replacing
`document["servers"]` is deliberate: it injects the configured target server
without modifying the original source file.

## Rules for Kraken

- Use the raw OpenAPI mapping for catalog, `describe`, and LLM JSON Schema.
- Use `aiopenapi3` only behind the `KrakenClient` adapter seam.
- Keep parser-specific models and private attributes out of public DTOs.
- Require a unique, non-empty `operationId` for every exposed HTTP operation.
- Never silently truncate an input schema returned to the LLM.
- Test request construction using `tests/fixtures/widgets-openapi.yaml`, not a
  write-service specification.

## References

- [aiopenapi3 API reference](https://aiopenapi3.readthedocs.io/en/latest/api.html)
- [aiopenapi3 usage guide](https://aiopenapi3.readthedocs.io/en/latest/use.html)
