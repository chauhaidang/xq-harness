# xq-kraken

`xq-kraken` explores an OpenAPI-backed catalog and dynamic client whose public
interface stays independent of the transport library.

- [API catalog contract](API_CATALOG_CONTRACT.md)
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
