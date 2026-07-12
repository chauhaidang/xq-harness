# Module Workflow

Use the module runner instead of ad-hoc install/build/test commands.

## Source of truth

- `modules.yaml` defines each module path, toolchain, and commands
- each module's `version.yaml` defines its semantic version, changelog, and native mirrors
- `scripts/module` executes those commands and respects dependency order

## Standard commands

```bash
./scripts/module list
./scripts/module info <module>
./scripts/module install <module>
./scripts/module build <module>
./scripts/module test <module>
./scripts/module ci <module>
./scripts/module test-all
```

## Rules

- Touch one module at a time unless the task explicitly spans multiple modules
- Prefer `./scripts/module ci <module>` for feature work verification
- Do not duplicate module commands in random shell snippets if `modules.yaml` already owns them
- Update the module's `version.yaml`, prepend its changelog entry, then run `./scripts/module sync-version <module>`
- Use `make test-all` only when the task affects shared behavior across test-all modules

## When to open more docs

- Open `docs/modules/README.md` only if the module runner behavior itself is unclear
- Open module-local README or skills only after selecting the target module
