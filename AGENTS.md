# Agent Instructions

`xq-harness` is a polyglot monorepo of XQ testing libraries, MCP tooling, iOS
modules, and release scripts. Published npm packages ship as
`@chauhaidang/xq-harness-*`.

## Startup Workflow

Before writing code:

1. Confirm working directory with `pwd`
2. Read this file completely
3. Read `progress.md` and `session-handoff.md`
4. Use `rg` or `rg --files` to locate only the files relevant to the task
5. Read the relevant module or process documentation
6. Restate Situation, Task, Action, and expected Result before edits

Do not preload broad docs or module trees unless they are relevant to the
current task.

## Working Rules

- **One workstream at a time**: Keep the current scope explicit in `progress.md`
- **Targeted loading**: Locate and read only the module and documentation needed for the task
- **Verification required**: Do not claim done without running the relevant checks
- **Update artifacts**: Before ending a session, update `progress.md` and `session-handoff.md`
- **Touch one module at a time**: Use `./scripts/module` for install, build, test, and CI
- **Minimal diffs**: Match existing patterns; do not refactor unrelated code
- **No secrets in git**: Never commit tokens, `.env` contents, or credentials
- **Commits and pushes**: Only when the user asks

## Agent skills

### Engineering workflows

Use `/ask-matt` to select the appropriate Matt Pocock engineering flow for planning, implementation, triage, QA, review, and codebase health. The repository setup is already complete; rerun `/setup-matt-pocock-skills` only to change the issue tracker, triage labels, or domain-doc layout.

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical labels mapped directly to their default names. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a multi-context layout organized around independently scoped modules. See `docs/agents/domain.md`.

## Change State Model

Every change session should explicitly capture these states in `progress.md`
before claiming completion:

- **Before state**: What behavior, files, feature status, and known risks exist before edits
- **After state**: What behavior, files, feature status, and known risks exist after edits
- **Regression test results**: Which commands ran, what passed or failed, and any gaps
- **PR ready**: Whether the diff is reviewable, scoped, documented, and free of known unfinished work
- **CI ready**: Whether the repo is ready for CI with the required local verification already run

Minimum expectations:

- Before edits, write or restate the **Before state** and the intended **After state**
- After edits, record **Regression test results** with command evidence
- Before ending, mark whether the work is **PR ready** and **CI ready**, with blockers if not

## Required Artifacts

- `progress.md` — current state, decisions, verification, next step
- `session-handoff.md` — fast resume file for the next session

## Definition of Done

Work is done only when all of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran
- [ ] Evidence is written into `progress.md`
- [ ] Session artifacts are updated for the next agent
- [ ] The relevant documented verification commands pass

## End of Session

Before ending a session:

1. Update `progress.md`
2. Update `session-handoff.md`
3. Record Before state, After state, regression results, PR-ready state, and CI-ready state
4. Record unresolved blockers or risks
5. Re-run the relevant documented verification commands

## Verification Commands

Common task checks:

- `./scripts/module list`
- `python3 scripts/validate-module-versions.py`
- `./scripts/module ci <module>`
- `make test-all`
- `git diff --check`

## Escalation

If you encounter:

- **Module ambiguity**: run `./scripts/module info <name>` before reading module docs
- **Architecture decisions**: locate the relevant ADR with `rg --files docs modules`
- **Process uncertainty**: inspect `./scripts/module` and the relevant workflow documentation
- **Scope ambiguity**: re-read `progress.md` and `session-handoff.md`, then ask the user
