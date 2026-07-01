"""Minimal in-memory learning API for MCP testbed runs."""

from __future__ import annotations

import json
import threading
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 18765
TESTBED_TOKEN = "testbed-token"


@dataclass
class Exercise:
    id: str
    lesson_id: str
    count: int
    exercise_type: str


@dataclass
class MockLearningApiState:
    exercises: list[Exercise] = field(default_factory=list)
    next_id: int = 1

    def create_exercise(
        self, *, lesson_id: str, count: int, exercise_type: str
    ) -> Exercise:
        exercise = Exercise(
            id=f"ex-{self.next_id}",
            lesson_id=lesson_id,
            count=count,
            exercise_type=exercise_type,
        )
        self.next_id += 1
        self.exercises.append(exercise)
        return exercise

    def list_exercises(self, *, lesson_id: str) -> list[Exercise]:
        return [item for item in self.exercises if item.lesson_id == lesson_id]


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: object) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    _ = handler.wfile.write(body)


def _read_json(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length else b""
    if not raw:
        return {}
    parsed = json.loads(raw.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError("JSON body must be an object")
    return parsed


def _authorized(handler: BaseHTTPRequestHandler) -> bool:
    auth = handler.headers.get("Authorization")
    return auth == f"Bearer {TESTBED_TOKEN}"


def build_handler(state: MockLearningApiState) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: object) -> None:
            _ = (format, args)

        def do_GET(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path == "/health":
                _json_response(self, 200, {"status": "ok"})
                return

            if parsed.path == "/exercises":
                if not _authorized(self):
                    _json_response(self, 401, {"error": "unauthorized"})
                    return
                query = parse_qs(parsed.query)
                lesson_ids = query.get("lesson_id", [])
                if not lesson_ids or not lesson_ids[0].strip():
                    _json_response(self, 400, {"error": "lesson_id is required"})
                    return
                lesson_id = lesson_ids[0]
                exercises = state.list_exercises(lesson_id=lesson_id)
                _json_response(
                    self,
                    200,
                    {
                        "lesson_id": lesson_id,
                        "exercises": [
                            {
                                "id": item.id,
                                "lesson_id": item.lesson_id,
                                "count": item.count,
                                "type": item.exercise_type,
                            }
                            for item in exercises
                        ],
                    },
                )
                return

            _json_response(self, 404, {"error": "not found"})

        def do_POST(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path != "/exercises":
                _json_response(self, 404, {"error": "not found"})
                return
            if not _authorized(self):
                _json_response(self, 401, {"error": "unauthorized"})
                return

            try:
                body = _read_json(self)
            except (json.JSONDecodeError, ValueError):
                _json_response(self, 400, {"error": "invalid json body"})
                return

            lesson_id = str(body.get("lesson_id", "")).strip()
            if not lesson_id:
                _json_response(self, 400, {"error": "lesson_id is required"})
                return

            count_raw = body.get("count", 1)
            if not isinstance(count_raw, int) or count_raw < 1:
                _json_response(self, 400, {"error": "count must be a positive integer"})
                return

            exercise_type = str(body.get("type", "vocabulary")).strip() or "vocabulary"
            exercise = state.create_exercise(
                lesson_id=lesson_id,
                count=count_raw,
                exercise_type=exercise_type,
            )
            _json_response(
                self,
                201,
                {
                    "id": exercise.id,
                    "lesson_id": exercise.lesson_id,
                    "count": exercise.count,
                    "type": exercise.exercise_type,
                },
            )

    return Handler


@contextmanager
def serve(
    *,
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    state: MockLearningApiState | None = None,
) -> Generator[str, None, None]:
    api_state = state or MockLearningApiState()
    handler = build_handler(api_state)
    server = ThreadingHTTPServer((host, port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    bound_host = server.server_address[0]
    bound_port = server.server_address[1]
    base_url = f"http://{bound_host}:{bound_port}"
    try:
        yield base_url
    finally:
        server.shutdown()
        thread.join(timeout=2)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Run the MCP testbed mock learning API")
    _ = parser.add_argument("--host", default=DEFAULT_HOST)
    _ = parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    print(f"Mock learning API listening on http://{args.host}:{args.port}")
    print(f"Use api_token={TESTBED_TOKEN!r} with configure_environment")
    with serve(host=str(args.host), port=int(args.port)):
        _ = threading.Event().wait()


if __name__ == "__main__":
    main()
