# Project Agent Team

The root agent owns orchestration, requirements, approvals, cross-role decisions,
final verification, commits, pushes, and the consolidated response.

## Roles

| Agent | Owns | Primary Matt workflows |
|---|---|---|
| `ui_ux_designer` | Journeys, interaction behavior, UI states, accessibility, UX acceptance criteria | `$research`, `$prototype` |
| `solution_designer` | Modules, interfaces, seams, data flow, ADR proposals, tracer slices | `$codebase-design`, `$design-an-interface`, `$research` |
| `backend_engineer` | Node.js, Python, services, CLIs, MCP, persistence, backend integrations | `$tdd`, `$diagnosing-bugs`, `$codebase-design` |
| `mobile_engineer` | Swift/iOS and Expo implementation, state, lifecycle, accessibility, device evidence | `$tdd`, `$diagnosing-bugs`, platform skills |
| `sdet` | Test strategy, agreed seams, automation, coverage matrices, flake and CI evidence | `$tdd`, `$diagnosing-bugs`, `$code-review` |
| `qa_engineer` | Exploratory user journeys, reproduction evidence, GitHub bug reports, retest | `$qa`, `$triage` |

## Sequencing

1. Stabilize the problem and acceptance criteria in the root thread.
2. Use `ui_ux_designer` and `solution_designer` in parallel only when product
   requirements are stable and their outputs can be reconciled before coding.
3. Start `backend_engineer` and `mobile_engineer` only after relevant contracts
   are approved. Parallelize them only with pinned contracts and disjoint files.
4. Let `sdet` define the risk model and test seams early; implement automation
   once interfaces and acceptance criteria are stable.
5. Use `qa_engineer` against a runnable build. QA reports and verifies behavior;
   it does not fix it.

## Delegation contract

Every delegated task must name:

- The issue, PRD, specification, or acceptance criteria.
- The selected agent and Matt skill to invoke.
- The assigned module and exact file ownership, or `read-only`.
- The expected output and verification command.
- Whether edits and external writes are allowed.

Subagents may not spawn descendants. The root waits for requested agents,
resolves conflicts, owns cross-module changes, and reports one consolidated result.
