import json
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from workshop.assertions import raises


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


class WidgetHandler(BaseHTTPRequestHandler):
    requested_paths: list[str] = []

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler interface
        type(self).requested_paths.append(self.path)
        widget = {"id": "widget-1", "name": "Keyboard", "quantity": 2}
        payload = json.dumps([widget] if self.path.startswith("/widgets?") else widget).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("X-Workshop", "yes")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def widget_server() -> Iterator[tuple[str, type[WidgetHandler]]]:
    WidgetHandler.requested_paths = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", WidgetHandler
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_invokes_an_operation_id_and_normalizes_the_response() -> None:
    from kraken.client import KrakenClient
    from kraken.dynamic_client import KrakenDynamicClient
    from kraken.errors import InvocationValidationError
    from kraken.models import InvocationRequest

    with widget_server() as (base_url, handler):
        client: KrakenClient = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url=base_url,
            allowed_operation_ids={"getWidget", "listWidgets"},
        )

        with raises(InvocationValidationError):
            client.invoke(InvocationRequest(operation_id="getWidget"))
        assert handler.requested_paths == []

        result = client.invoke(
            InvocationRequest(
                operation_id="getWidget",
                parameters={"widgetId": "widget-1"},
            )
        )
        collection = client.invoke(
            InvocationRequest(
                operation_id="listWidgets",
                parameters={"limit": 2},
            )
        )

    assert handler.requested_paths == ["/widgets/widget-1", "/widgets?limit=2"]
    assert result.operation_id == "getWidget"
    assert result.status_code == 200
    assert result.headers["x-workshop"] == "yes"
    assert result.data == {"id": "widget-1", "name": "Keyboard", "quantity": 2}
    assert collection.data == [{"id": "widget-1", "name": "Keyboard", "quantity": 2}]
