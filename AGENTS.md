# Agent Instructions

`xq-harness` is a polyglot monorepo of XQ testing libraries, MCP tooling, iOS
modules, and release scripts. Published npm packages ship as
`@chauhaidang/xq-harness-*`.

## Startup Workflow

Before writing code:

1. Confirm working directory with `pwd`
2. Read this file completely
3. Run `./init.sh`
4. Run `node scripts/harness-context.mjs summary`
5. Read `feature_list.json` and `progress.md`
6. Query only the needed detail:
   - `node scripts/harness-context.mjs topic <topic-id>`
   - `node scripts/harness-context.mjs module <module-name>`
   - `node scripts/harness-context.mjs feature <feature-id|active>`
   - `node scripts/harness-context.mjs search <term>`
7. Restate Situation, Task, Action, and expected Result before edits

Do not preload broad docs or module trees unless the harness query tells you
they are relevant to the current task.

## Working Rules

- **One feature at a time**: Pick exactly one active or next feature from `feature_list.json`
- **Query before loading**: Use the harness query script before opening broad docs
- **Verification required**: Do not claim done without running the relevant checks
- **Update artifacts**: Before ending a session, update `progress.md`, `feature_list.json`, and `session-handoff.md`
- **Touch one module at a time**: Use `./scripts/module` for install, build, test, and CI
- **Minimal diffs**: Match existing patterns; do not refactor unrelated code
- **No secrets in git**: Never commit tokens, `.env` contents, or credentials
- **Commits and pushes**: Only when the user asks

## Project Agent Team

Project-scoped custom agents live in `.codex/agents/`. Read
`.codex/TEAM.md` before delegating work. The root agent owns orchestration and
may spawn one role, a group of complementary roles, or multiple instances of a
role. Assign disjoint module and file ownership before parallel edits; keep
subagent nesting disabled and consolidate all results in the root thread.

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

- `feature_list.json` — source of truth for feature status and evidence
- `progress.md` — current state, decisions, verification, next step
- `session-handoff.md` — fast resume file for the next session
- `.repo-harness/context-index.json` — bounded context index
- `.repo-harness/topics/*.md` — on-demand detail
- `scripts/harness-context.mjs` — query entrypoint
- `init.sh` — startup and verification path

## Definition of Done

A feature is done only when all of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran
- [ ] Evidence is written into `feature_list.json` or `progress.md`
- [ ] Session artifacts are updated for the next agent
- [ ] The repository still starts cleanly from `./init.sh`

## End of Session

Before ending a session:

1. Update `progress.md`
2. Update `feature_list.json`
3. Update `session-handoff.md`
4. Record Before state, After state, regression results, PR-ready state, and CI-ready state
5. Record unresolved blockers or risks
6. Re-run relevant verification

## Verification Commands

```bash
./init.sh
```

Common task checks:

- `./scripts/module list`
- `./scripts/module ci <module>`
- `make test-all`
- `node scripts/harness-context.mjs summary`

## Escalation

If you encounter:

- **Module ambiguity**: query `node scripts/harness-context.mjs module <name>` before reading module docs
- **Architecture decisions**: query `node scripts/harness-context.mjs topic architecture-decisions`
- **Process uncertainty**: query `node scripts/harness-context.mjs topic module-workflow`
- **Scope ambiguity**: re-read `feature_list.json` and `progress.md`, then ask the user
