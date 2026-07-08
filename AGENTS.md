# Agent Instructions

Instructions for AI agents working in **xq-harness** — a polyglot monorepo of
XQ testing libraries, a module runner, and supporting tooling. Published npm
packages ship as `@chauhaidang/xq-harness-*` on GitHub Packages.

---

## Start of every session

1. **Pick a skill** — read `.agents/skills/` (and module skills under
   `modules/*/skills/`) before acting. Match the user's goal to the closest
   skill and follow it end-to-end.
2. **Load only task-relevant context** — read the docs and module files needed
   for the current task. Do not preload broad repo history unless the task
   explicitly requires it.
3. **Confirm scope** — restate Situation, Task, Action, and expected Result
   (STAR) before making changes. Ask when requirements or the target module are
   unclear.
4. **Touch one module at a time** — use `./scripts/module` for install, build,
   test, and CI. Do not duplicate commands from `modules.yaml` elsewhere.

---

## Skills

### Repo-level (`.agents/skills/`)

| Skill                      | Use when…                                 |
| -------------------------- | ----------------------------------------- |
| `ask-matt`                 | Unsure which skill or flow fits           |
| `implement`                | Building from a PRD or issue              |
| `tdd`                      | Test-first development                    |
| `review`                   | Reviewing changes since a fixed point     |
| `qa`                       | Interactive bug reports → GitHub issues   |
| `triage`                   | Triage incoming issues or external PRs    |
| `to-prd` / `to-issues`     | Turn conversation into a PRD, then issues |
| `grill-with-docs`          | Sharpen a plan; writes ADRs and context   |
| `design-an-interface`      | Explore multiple interface designs        |
| `codebase-design`          | Deep-module vocabulary for API design     |
| `handoff`                  | Compact context for a fresh session       |
| `setup-matt-pocock-skills` | First-time setup for engineering skills   |
| `setup-pre-commit`         | Husky + lint-staged hooks                 |

Full skill bodies live in `.agents/skills/<name>/SKILL.md`. Read the matching
file before executing — do not improvise when a skill exists.

### Module-level (`modules/*/skills/`)

Use these when work is scoped to a specific module:

| Module               | Skill                                 | Use when…                                      |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| `xq-octopus`         | `xq-octopus`                          | Direct REST API checks with the xq-octopus CLI |
| `xq-test-harness`    | `xq-test-harness-bdd`                 | Consumer BDD / Playwright setup                |
| `xq-test-utils`      | `e2e-app`, `e2e-config`, `e2e-screen` | Detox / mobile E2E helpers                     |
| `ios-xq-finance-app` | `ios-xq-finance-app`                  | SwiftUI app, portfolio model, XCTest           |

**Consumer install:** `@chauhaidang/xq-skills` bundles all distributable module
skills. Run `xq-scripts/scripts/install-skills.js` after installing it in a
consumer project.

If no skill matches, proceed with normal engineering judgment — keep changes
minimal and aligned with surrounding code.

---

## Key docs

| Topic                       | Location                                                       |
| --------------------------- | -------------------------------------------------------------- |
| Consumer package index      | [CATALOGUE.md](CATALOGUE.md)                                   |
| Contributor overview        | [README.md](README.md)                                         |
| Module registry & runner    | [docs/modules/README.md](docs/modules/README.md)               |
| CI/CD per module            | [docs/github-actions.md](docs/github-actions.md)               |
| Architecture decisions      | [docs/decisions/](docs/decisions/)                             |
| Product / stories           | [docs/product/](docs/product/), [docs/stories/](docs/stories/) |

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
lockfile and toolchain (Node 22+, Python/uv, Xcode, etc.) — see `modules.yaml`.

**XQ npm packages** (`xq-common-kit`, `xq-test-utils`, `xq-test-infra`,
`xq-test-harness`): pnpm 10 with `workspace:*` sibling deps inside the monorepo;
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
- **Action** — what you did (commands, files, docs updated)
- **Result** — outcome, test status, and anything left open
