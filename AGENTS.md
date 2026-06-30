# Agent Instructions

Instructions for AI agents working in **xq-harness** — a polyglot monorepo of
XQ testing libraries, a module runner, and supporting tooling. Published npm
packages ship as `@chauhaidang/xq-harness-*` on GitHub Packages.

---

## Start of every session

1. **Pick a skill** — read `.agents/skills/` (and module skills under
   `modules/*/skills/`) before acting. Match the user's goal to the closest
   skill and follow it end-to-end.
2. **Load prior context** — run `harness-state init`, then read
   `harness-state timeline --limit 100` and `docs/context/*.md` when they exist.
3. **Confirm scope** — restate Situation, Task, Action, and expected Result
   (STAR) before making changes. Ask when requirements or the target module are
   unclear.
4. **Touch one module at a time** — use `./scripts/module` for install, build,
   test, and CI. Do not duplicate commands from `modules.yaml` elsewhere.

---

## Skills

### Repo-level (`.agents/skills/`)

| Skill | Use when… |
| --- | --- |
| `ask-matt` | Unsure which skill or flow fits |
| `harness-state` | Recording or querying project memory |
| `implement` | Building from a PRD or issue |
| `tdd` | Test-first development |
| `review` | Reviewing changes since a fixed point |
| `qa` | Interactive bug reports → GitHub issues |
| `triage` | Triage incoming issues or external PRs |
| `to-prd` / `to-issues` | Turn conversation into a PRD, then issues |
| `grill-with-docs` | Sharpen a plan; writes ADRs and context |
| `design-an-interface` | Explore multiple interface designs |
| `codebase-design` | Deep-module vocabulary for API design |
| `handoff` | Compact context for a fresh session |
| `setup-matt-pocock-skills` | First-time setup for engineering skills |
| `setup-pre-commit` | Husky + lint-staged hooks |

Full skill bodies live in `.agents/skills/<name>/SKILL.md`. Read the matching
file before executing — do not improvise when a skill exists.

### Module-level (`modules/*/skills/`)

Use these when work is scoped to a specific module:

| Module | Skill | Use when… |
| --- | --- | --- |
| `harness-state` | `harness-state` | CLI usage details (canonical copy) |
| `xq-test-harness` | `xq-test-harness-bdd` | Consumer BDD / Playwright setup |
| `xq-test-utils` | `e2e-app`, `e2e-config`, `e2e-screen` | Detox / mobile E2E helpers |
| `ios-xq-finance-app` | `ios-xq-finance-app` | SwiftUI app, portfolio model, XCTest |

If no skill matches, proceed with normal engineering judgment — keep changes
minimal and aligned with surrounding code.

---

## Project memory (harness-state)

**Always record meaningful work.** Requirements, decisions (with rationale),
specs, solutions, tasks, and workspace checkpoints must go through the
`harness-state` CLI — not hand-edited Markdown or JSONL.

```bash
cd modules/harness-state && uv sync   # once per environment
harness-state init                    # idempotent; run every session
```

Follow `.agents/skills/harness-state/SKILL.md` for commands and rules. Before
ending a session that changed project understanding:

- Record decisions with `--rationale`
- Link entities by printed IDs (REQ-, DEC-, SPEC-, etc.)
- Run `harness-state export` so `docs/context/*.md` stays reviewable

Never commit secrets or large logs in event bodies — reference artifact paths
under `.harness/artifacts/` instead.

---

## Key docs

| Topic | Location |
| --- | --- |
| Consumer package index | [CATALOGUE.md](CATALOGUE.md) |
| Contributor overview | [README.md](README.md) |
| Module registry & runner | [docs/modules/README.md](docs/modules/README.md) |
| CI/CD per module | [docs/github-actions.md](docs/github-actions.md) |
| Architecture decisions | [docs/decisions/](docs/decisions/) |
| Product / stories | [docs/product/](docs/product/), [docs/stories/](docs/stories/) |
| Project context (generated) | [docs/context/](docs/context/) |

---

## Build and test

`modules.yaml` is the single source of truth for module paths, versions, and
commands.

```bash
./scripts/module list                    # all modules
./scripts/module ci xq-common-kit        # install + build + test
make test-all                            # modules with test_all: true
```

Requires [yq](https://github.com/mikefarah/yq). Each module has its own
lockfile and toolchain (Node 18+, Python/uv, Xcode, etc.) — see `modules.yaml`.

**XQ npm packages** (`xq-common-kit`, `xq-test-utils`, `xq-test-infra`,
`xq-test-harness`): Yarn 4 with `portal:` sibling deps inside the monorepo;
consumers install `@chauhaidang/xq-harness-*` from GitHub Packages.

---

## Conventions

- **Minimal diffs** — match existing naming, types, and patterns in the module
  you touch. Do not refactor unrelated code.
- **No secrets in git** — never commit tokens, `.env` contents, or credentials.
- **Commits and PRs** — only when the user asks. Do not push unless asked.
- **Module runner** — prefer `./scripts/module` over ad-hoc commands so CI and
  local runs stay aligned.
- **Package naming** — harness-lineage packages use the `xq-harness-*` prefix
  (see [ADR 0010](docs/decisions/0010-xq-harness-package-rename.md)). Legacy
  `xq-*` names without `harness-` are a separate product line.

---

## STAR reporting

After completing work, summarize for the user:

- **Situation** — what context or problem existed
- **Task** — what was asked or decided
- **Action** — what you did (commands, files, harness-state records)
- **Result** — outcome, test status, and anything left open

Record the same Action and Result in harness-state when the work affects future
decisions or project memory.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **xq-harness** (2731 symbols, 4953 relationships, 133 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/xq-harness/context` | Codebase overview, check index freshness |
| `gitnexus://repo/xq-harness/clusters` | All functional areas |
| `gitnexus://repo/xq-harness/processes` | All execution flows |
| `gitnexus://repo/xq-harness/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
