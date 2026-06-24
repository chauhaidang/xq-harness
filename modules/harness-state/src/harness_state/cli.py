import argparse
import sys

from . import HarnessState, HarnessStateError

VERSION = "0.1.0"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="harness-state",
        description="Record and inspect project context over time.",
    )
    parser.add_argument(
        "--version", action="version", version=f"harness-state {VERSION}"
    )

    subparsers = parser.add_subparsers(dest="command", metavar="<command>")

    subparsers.add_parser("init", help="Initialize harness state in this repo")

    # requirement
    requirement = subparsers.add_parser("requirement", help="Manage requirements")
    requirement_sub = requirement.add_subparsers(dest="action", metavar="<action>")
    req_add = requirement_sub.add_parser("add", help="Add a requirement")
    req_add.add_argument("title")
    req_add.add_argument("--body", default="")
    req_add.add_argument("--source", default=None)

    # decision
    decision = subparsers.add_parser("decision", help="Manage decisions")
    decision_sub = decision.add_subparsers(dest="action", metavar="<action>")
    dec_record = decision_sub.add_parser("record", help="Record a decision")
    dec_record.add_argument("title")
    dec_record.add_argument("--body", default="")
    dec_record.add_argument("--rationale", default="")

    # spec
    spec = subparsers.add_parser("spec", help="Manage specs")
    spec_sub = spec.add_subparsers(dest="action", metavar="<action>")
    spec_add = spec_sub.add_parser("add", help="Add a spec")
    spec_add.add_argument("title")
    spec_add.add_argument("--body", default="")
    spec_add.add_argument("--requirement", dest="requirement_id", default=None)

    # solution
    solution = subparsers.add_parser("solution", help="Manage solutions")
    solution_sub = solution.add_subparsers(dest="action", metavar="<action>")
    sol_propose = solution_sub.add_parser("propose", help="Propose a solution")
    sol_propose.add_argument("title")
    sol_propose.add_argument("--body", default="")
    sol_propose.add_argument("--spec", dest="spec_id", default=None)

    # task
    task = subparsers.add_parser("task", help="Manage tasks")
    task_sub = task.add_subparsers(dest="action", metavar="<action>")
    task_add = task_sub.add_parser("add", help="Add a task")
    task_add.add_argument("title")
    task_add.add_argument("--body", default="")
    task_add.add_argument("--priority", default=None)
    task_status = task_sub.add_parser("status", help="Change a task's status")
    task_status.add_argument("task_id")
    task_status.add_argument("status")

    # workspace
    workspace = subparsers.add_parser("workspace", help="Observe the workspace")
    workspace_sub = workspace.add_subparsers(dest="action", metavar="<action>")
    workspace_sub.add_parser("observe", help="Record current workspace state")

    # timeline
    timeline = subparsers.add_parser("timeline", help="Show the event timeline")
    timeline.add_argument("--limit", type=int, default=50)

    # show
    show = subparsers.add_parser("show", help="Show an entity by id")
    show.add_argument("entity_type")
    show.add_argument("entity_id")

    subparsers.add_parser("export", help="Export Markdown context to docs/context")
    subparsers.add_parser("rebuild", help="Rebuild the local DB from JSONL events")

    return parser


def _cmd_init(state: HarnessState) -> int:
    state.init()
    print(f"Initialized harness state in {state.paths.harness_dir}")
    return 0


def _cmd_requirement(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "add":
        req_id = state.record_requirement(args.title, args.body, args.source)
        print(f"Created requirement {req_id}")
        return 0
    return _missing_action("requirement")


def _cmd_decision(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "record":
        dec_id = state.record_decision(args.title, args.body, args.rationale)
        print(f"Recorded decision {dec_id}")
        return 0
    return _missing_action("decision")


def _cmd_spec(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "add":
        spec_id = state.record_spec(args.title, args.body, args.requirement_id)
        print(f"Created spec {spec_id}")
        return 0
    return _missing_action("spec")


def _cmd_solution(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "propose":
        sol_id = state.propose_solution(args.title, args.body, args.spec_id)
        print(f"Proposed solution {sol_id}")
        return 0
    return _missing_action("solution")


def _cmd_task(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "add":
        task_id = state.create_task(args.title, args.body, args.priority)
        print(f"Created task {task_id}")
        return 0
    if args.action == "status":
        state.change_task_status(args.task_id, args.status)
        print(f"Updated task {args.task_id} status to {args.status}")
        return 0
    return _missing_action("task")


def _cmd_workspace(state: HarnessState, args: argparse.Namespace) -> int:
    if args.action == "observe":
        ws_id = state.observe_workspace()
        print(f"Observed workspace {ws_id}")
        return 0
    return _missing_action("workspace")


def _cmd_timeline(state: HarnessState, args: argparse.Namespace) -> int:
    events = state.timeline(limit=args.limit)
    if not events:
        print("No events recorded.")
        return 0
    for event in events:
        title = event.get("title") or ""
        print(
            f"{event['sequence']:04d} {event['timestamp']} "
            f"{event['event_type']} {event['entity_id']} {title}".rstrip()
        )
    return 0


def _cmd_show(state: HarnessState, args: argparse.Namespace) -> int:
    row = state.show(args.entity_type, args.entity_id)
    width = max(len(key) for key in row)
    for key, value in row.items():
        print(f"{key.ljust(width)}  {value}")
    return 0


def _cmd_export(state: HarnessState) -> int:
    state.export_markdown()
    print(f"Exported Markdown context to {state.paths.context_dir}")
    return 0


def _cmd_rebuild(state: HarnessState) -> int:
    state.rebuild()
    print("Rebuilt local database from JSONL events.")
    return 0


def _missing_action(command: str) -> int:
    print(f"error: '{command}' requires a subcommand", file=sys.stderr)
    return 2


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if not args.command:
        parser.print_help()
        return 0

    state = HarnessState()

    try:
        if args.command == "init":
            return _cmd_init(state)
        if args.command == "requirement":
            return _cmd_requirement(state, args)
        if args.command == "decision":
            return _cmd_decision(state, args)
        if args.command == "spec":
            return _cmd_spec(state, args)
        if args.command == "solution":
            return _cmd_solution(state, args)
        if args.command == "task":
            return _cmd_task(state, args)
        if args.command == "workspace":
            return _cmd_workspace(state, args)
        if args.command == "timeline":
            return _cmd_timeline(state, args)
        if args.command == "show":
            return _cmd_show(state, args)
        if args.command == "export":
            return _cmd_export(state)
        if args.command == "rebuild":
            return _cmd_rebuild(state)
    except HarnessStateError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
