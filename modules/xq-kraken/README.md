# xq-kraken

`xq-kraken` is an operation-centric CLI for discovering and invoking REST API
operations through local OpenAPI contracts. It gives humans and agents the same
deterministic JSON interface while validating requests and documented responses
against the selected API definition.

Kraken provides:

- operation discovery by OpenAPI `operationId`
- focused input contracts for one operation at a time
- optional operation allowlists
- request and response validation
- status and JSON Pointer response assertions
- typed references for chaining values across CLI calls
- isolated local execution and scenario state

## Quick start

Create `kraken.yaml` in the directory where commands will run:

```yaml
apis:
  widgets:
    spec: ./openapi/widgets.yaml
    base_url: http://127.0.0.1:8080
    allowed_operations:
      - listWidgets
      - getWidget
      - createWidget
```

Start an execution and scenario, discover an operation, inspect its input
contract, and invoke it:

```text
kraken execution start
kraken scenario start
kraken search widget
kraken describe @o1
kraken invoke @o1 --input request.json
kraken execution finish
```

Invocation input is one JSON object containing optional parameters, a request
body, and response assertions:

```json
{
  "body": {
    "name": "Keyboard",
    "quantity": 2
  },
  "assertions": {
    "status": 201,
    "body": {
      "/name": "Keyboard"
    }
  }
}
```

JSON is the canonical output format. Add `--pretty` for indented output and
`--no-state` to an invocation when its response should not be retained.

Search results receive operation references such as `@o1`. Successful
invocations without assertions can receive immutable response references such
as `@r1`, which later requests can resolve with an RFC 6901 JSON Pointer.
Execution state is local to the directory containing `kraken.yaml` and is
removed by `kraken execution finish`.

## Resources

- [Demo presentation](demo.html)
- [Agent skill](skills/xq-kraken/SKILL.md)
