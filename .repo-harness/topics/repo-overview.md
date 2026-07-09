# Repo Overview

`xq-harness` is a polyglot monorepo for XQ testing and automation tooling.

## What lives here

- `modules/` — independent code modules with their own toolchains
- `modules.yaml` — single source of truth for module paths, versions, and commands
- `scripts/module` — install/build/test/ci runner against `modules.yaml`
- `docs/` — contributor, architecture, release, and product docs
- `AGENTS.md` plus harness files — startup and session continuity for agents

## Main package lines

- Harness-lineage npm packages: `@chauhaidang/xq-harness-*`
- Skills package: `@chauhaidang/xq-skills`
- MCP/server and iOS modules live alongside the npm packages as first-class modules

## What not to load by default

- Whole `docs/` trees
- Whole module trees
- Architecture decision docs
- Release workflow docs

Load those only after a topic, feature, or module query shows they matter.

## When to query deeper

- Need build/test commands: query `module-workflow`
- Need process/startup rules: query `agent-workflow`
- Need architecture or product rationale: query `architecture-decisions`
- Need a specific implementation area: query `module <name>`
