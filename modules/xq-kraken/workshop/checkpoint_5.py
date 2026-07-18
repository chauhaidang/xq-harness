import json
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from workshop.assertions import raises


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


class CreateWidgetHandler(BaseHTTPRequestHandler):
    received_bodies: list[object] = []

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler interface
        length = int(self.headers["Content-Length"])
        body = json.loads(self.rfile.read(length))
        type(self).received_bodies.append(body)
        if body["name"] == "http-error":
            self.send_response(503)
            self.end_headers()
            return
        if body["name"] == "bad-response":
            payload = json.dumps({"name": "bad-response", "quantity": 1}).encode()
            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        payload = json.dumps({"id": "widget-2", **body}).encode()
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def widget_server() -> Iterator[tuple[str, type[CreateWidgetHandler]]]:
    CreateWidgetHandler.received_bodies = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), CreateWidgetHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", CreateWidgetHandler
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_search_describe_validate_and_invoke_form_one_flow() -> None:
    from kraken.client import KrakenClient
    from kraken.dynamic_client import KrakenDynamicClient
    from kraken.errors import (
        InvocationHttpError,
        InvocationResponseError,
        InvocationTransportError,
        InvocationValidationError,
    )
    from kraken.models import InvocationRequest

    with widget_server() as (base_url, handler):
        client: KrakenClient = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url=base_url,
            allowed_operation_ids={"createWidget"},
        )

        summary = client.search("create")[0]
        description = client.describe(summary.operation_id)
        assert description.request_body is not None

        with raises(InvocationValidationError):
            client.invoke(InvocationRequest(operation_id=summary.operation_id))

        with raises(InvocationValidationError):
            client.invoke(
                InvocationRequest(
                    operation_id=summary.operation_id,
                    body={"name": "Keyboard", "quantity": 0},
                )
            )
        assert handler.received_bodies == []

        with raises(InvocationHttpError):
            client.invoke(
                InvocationRequest(
                    operation_id=summary.operation_id,
                    body={"name": "http-error", "quantity": 1},
                )
            )

        with raises(InvocationResponseError):
            client.invoke(
                InvocationRequest(
                    operation_id=summary.operation_id,
                    body={"name": "bad-response", "quantity": 1},
                )
            )

        result = client.invoke(
            InvocationRequest(
                operation_id=summary.operation_id,
                body={"name": "Keyboard", "quantity": 2},
            )
        )

    assert handler.received_bodies == [
        {"name": "http-error", "quantity": 1},
        {"name": "bad-response", "quantity": 1},
        {"name": "Keyboard", "quantity": 2},
    ]
    assert result.status_code == 201
    assert result.data == {
        "id": "widget-2",
        "name": "Keyboard",
        "quantity": 2,
    }

    with raises(InvocationTransportError):
        client.invoke(
            InvocationRequest(
                operation_id="createWidget",
                body={"name": "Keyboard", "quantity": 1},
            )
        )
