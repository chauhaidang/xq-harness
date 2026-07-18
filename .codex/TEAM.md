# XQ Harness Agent Team

Codex discovers the project-scoped roles in `.codex/agents/`. The root agent
owns orchestration, scope boundaries, integration, and the final answer.

## Roles

| Agent | Primary responsibility |
| --- | --- |
| `product_owner` | Outcomes, priorities, acceptance criteria, and scope |
| `solution_designer` | Architecture, interfaces, data flow, and technical risk |
| `ui_designer` | Interaction design, states, accessibility, and visual specifications |
| `backend_dev` | Services, APIs, persistence, and backend tests |
| `frontend_dev` | Client UI, state, integration, and frontend tests |
| `sdet` | Test strategy, automation, regression, and quality evidence |
| `devops` | CI/CD, releases, environments, observability, and operational safety |

## Orchestration rules

- Spawn one agent for focused work and multiple agents only for independent,
  bounded tasks that benefit from parallelism.
- The root agent assigns one owner per file or module. Agents must not make
  overlapping edits concurrently.
- Prefer parallel read-only discovery and review. Run write-heavy work in
  separate modules or sequential waves.
- Subagents do not spawn more agents. The root agent coordinates all fan-out,
  follow-up instructions, waits, and consolidation.
- The root agent owns `feature_list.json`, `progress.md`, and
  `session-handoff.md` unless it explicitly delegates one of them.
- Every agent follows `AGENTS.md`, preserves unrelated dirty changes, reports
  commands and evidence, and returns a concise handoff with risks and blockers.

## Suggested groups

- Product discovery: `product_owner`, `solution_designer`, `ui_designer`.
- Feature delivery: `backend_dev` and `frontend_dev` on disjoint paths, with
  `solution_designer` reviewing interface alignment.
- Quality gate: `sdet` for behavior and regression, `devops` for CI and release
  readiness.
- Full delivery: discovery first, implementation second, quality gate last.

Multiple instances of a role are allowed. Partition them by module, platform,
scenario, or review concern, and give each instance a distinct bounded task.

## Prompt examples

```text
Spawn a product_owner and solution_designer to turn this request into acceptance
criteria and an implementation boundary. Wait for both and reconcile conflicts.
```

```text
Spawn two sdet agents: one owns API coverage and one owns iOS UI coverage. Keep
both read-only, wait for both, then return one prioritized test-gap report.
```

```text
Use backend_dev and frontend_dev in parallel. Assign disjoint modules and file
ownership before edits, then ask sdet to verify the integrated behavior.
```
