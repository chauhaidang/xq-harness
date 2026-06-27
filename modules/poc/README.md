# POC Module

`poc` is a parking place for prototypes, learning spikes, and short-lived
initiatives that do not yet belong to a product or package module.

Use this module when:

- exploring a new integration or protocol, such as an MCP server
- validating an implementation approach before creating a durable module
- collecting small examples that support a design decision or PRD

Keep POCs small and disposable. When a POC becomes useful product code, move it
into a purpose-built module and update `modules.yaml` with real build and test
commands.

## Runner

The module is registered with no-op commands so it works with the module runner
without adding CI or release overhead:

```bash
./scripts/module ci poc
```
