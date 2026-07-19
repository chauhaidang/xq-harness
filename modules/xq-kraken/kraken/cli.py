"""Installed command-line boundary for Kraken."""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, NoReturn, TextIO, cast

from .application import ApplicationError, CommandOptions, KrakenApplication
from .models import JsonValue


class _StructuredArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> NoReturn:
        raise ApplicationError("invalid_input", message, exit_code=2)


def _common_parser() -> _StructuredArgumentParser:
    parser = _StructuredArgumentParser(add_help=False)
    parser.add_argument("--config", type=Path, default=argparse.SUPPRESS)
    parser.add_argument("--session", default=argparse.SUPPRESS)
    parser.add_argument("--pretty", action="store_true", default=argparse.SUPPRESS)
    parser.add_argument("--api", default=argparse.SUPPRESS)
    parser.add_argument("--spec", type=Path, default=argparse.SUPPRESS)
    parser.add_argument("--base-url", default=argparse.SUPPRESS)
    return parser


def _parser() -> argparse.ArgumentParser:
    common = _common_parser()
    parser = _StructuredArgumentParser(
        prog="kraken",
        description="Discover and invoke OpenAPI operations.",
        parents=[common],
    )
    commands = parser.add_subparsers(dest="command", required=True)

    search = commands.add_parser("search", parents=[common], help="Search operations")
    search.add_argument("query")

    describe = commands.add_parser("describe", parents=[common], help="Describe an operation")
    describe.add_argument("target")

    invoke = commands.add_parser("invoke", parents=[common], help="Invoke an operation")
    invoke.add_argument("target")
    invoke.add_argument("--input", required=True, dest="input_path")
    invoke.add_argument("--no-state", action="store_true")

    refs = commands.add_parser("refs", parents=[common], help="Inspect reference state")
    refs.add_argument("refs_action", choices=("list", "status", "gc", "clear"))

    resolve = commands.add_parser("resolve", parents=[common], help="Resolve a reference")
    resolve.add_argument("target")
    resolve.add_argument("--pointer", default="")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Parse, execute, and render one command.

    Console-script launchers pass no arguments. The optional sequence keeps the
    boundary directly reusable by packaging smoke checks without changing its
    subprocess-first acceptance contract.
    """

    arguments = sys.argv[1:] if argv is None else list(argv)
    try:
        namespace = _parser().parse_args(arguments)
        input_data = _read_invocation_input(namespace) if namespace.command == "invoke" else None
        options = CommandOptions(
            command=namespace.command,
            config=getattr(namespace, "config", None),
            session=getattr(namespace, "session", None),
            pretty=getattr(namespace, "pretty", False),
            api=getattr(namespace, "api", None),
            spec=getattr(namespace, "spec", None),
            base_url=getattr(namespace, "base_url", None),
            query=getattr(namespace, "query", None),
            target=getattr(namespace, "target", None),
            input_data=input_data,
            no_state=getattr(namespace, "no_state", False),
            refs_action=getattr(namespace, "refs_action", None),
            pointer=getattr(namespace, "pointer", ""),
        )
        outcome = KrakenApplication(cwd=Path.cwd(), environ=os.environ).execute(options)
        _write_json(outcome.payload, sys.stdout if outcome.stream == "stdout" else sys.stderr, options.pretty)
        return outcome.exit_code
    except ApplicationError as error:
        payload = {
            "ok": False,
            "error": {
                "kind": error.kind,
                "message": str(error),
                "details": dict(error.details),
            },
        }
        pretty = "--pretty" in arguments
        _write_json(payload, sys.stderr, pretty)
        return error.exit_code
    except Exception as error:  # pragma: no cover - defensive public boundary
        payload = {
            "ok": False,
            "error": {
                "kind": "internal_failure",
                "message": "Unexpected internal failure",
                "details": {"type": type(error).__name__},
            },
        }
        _write_json(payload, sys.stderr, "--pretty" in arguments)
        return 70


def _read_invocation_input(namespace: argparse.Namespace) -> Mapping[str, JsonValue]:
    input_path = cast(str, namespace.input_path)
    try:
        text = sys.stdin.read() if input_path == "-" else Path(input_path).read_text(encoding="utf-8")
        value = json.loads(text, parse_constant=_reject_non_finite)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as error:
        raise ApplicationError("invalid_input", "Invocation input must be valid JSON", exit_code=2) from error
    if not isinstance(value, Mapping):
        raise ApplicationError("invalid_input", "Invocation input must be a JSON object", exit_code=2)
    return cast(Mapping[str, JsonValue], value)


def _reject_non_finite(value: str) -> NoReturn:
    raise ValueError(f"non-finite JSON number: {value}")


def _write_json(payload: Mapping[str, Any], stream: TextIO, pretty: bool) -> None:
    if pretty:
        rendered = json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False)
    else:
        rendered = json.dumps(
            payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        )
    stream.write(rendered)
    stream.write("\n")


if __name__ == "__main__":
    raise SystemExit(main())
