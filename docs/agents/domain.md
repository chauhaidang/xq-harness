# Domain Docs

This repository uses a multi-context domain-documentation layout organized around independently scoped modules.

## Before exploring, read these

- `CONTEXT-MAP.md` at the repository root, when present. It points to the contexts relevant to each area.
- The relevant `modules/<module>/CONTEXT.md`, when present.
- System-wide ADRs under `docs/adr/`.
- Module-specific ADRs under `modules/<module>/docs/adr/`.

If any of these files do not exist, proceed silently. Do not suggest creating them upfront. Domain-modeling workflows create them lazily when terminology or architectural decisions are resolved.

## File structure

```text
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                         # System-wide decisions
└── modules/
    ├── <module-a>/
    │   ├── CONTEXT.md
    │   └── docs/
    │       └── adr/                 # Module-specific decisions
    └── <module-b>/
        ├── CONTEXT.md
        └── docs/
            └── adr/
```

## Use each context's vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined by the relevant `CONTEXT.md`.

Avoid synonyms that the context glossary explicitly rejects. If a needed concept is absent, reconsider whether the term belongs to the project or record the gap for a domain-modeling session.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, identify the conflict explicitly instead of silently overriding the decision.
