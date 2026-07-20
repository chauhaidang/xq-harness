# xq-kraken

`xq-kraken` explores an OpenAPI-backed catalog and dynamic client whose public
interface stays independent of the transport library.

- [API catalog contract](API_CATALOG_CONTRACT.md)
- [Domain context and glossary](CONTEXT.md)
- [Operation-centric CLI decision](docs/adr/0001-operation-centric-cli.md)
- [Stateful CLI reference decision](docs/adr/0002-stateful-cli-references.md)
- [Workshop](workshop.md)
- [aiopenapi3 cheat sheet](aiopenapi3-cheat-sheet.md)

The workshop follows a KISS design: one concrete `KrakenDynamicClient` facade
around private `aiopenapi3` parsing and validation. Functional behavior and
workshop checkpoints use Gherkin scenarios executed by Behave; `unittest`
remains only for structural/unit checks.

Runtime code lives in the importable `kraken` package, ordinary tests and their
owned fixture live under `tests`, and guided exercises live under `workshop`.
The workshop uses only `tests/fixtures/widgets-openapi.yaml`; it does not depend
on write-service or any other module's OpenAPI document.

```python
from kraken import FileApiSource
```

## CLI

The installed `kraken` command discovers `kraken.yaml` in the working directory
or accepts `--config`. Configuration may name several local OpenAPI documents:

```yaml
apis:
  widgets:
    spec: ./openapi/widgets.yaml
    base_url: http://127.0.0.1:8080
```

Canonical output is JSON:

```text
kraken execution start
kraken scenario start
kraken search widget
kraken describe @o1
kraken invoke @o1 --input request.json
kraken resolve @r1 --pointer /id
kraken refs status
kraken execution finish
```

Use `--pretty` for an indented view and `--no-state` on invocation to suppress
response retention. Runtime handles are stored in `./.kraken/execution.sqlite`
beside the exact working-directory `kraken.yaml`; `kraken execution finish`
removes that local state. Scenario-bound commands may omit `--scenario` only
when exactly one scenario is open.
