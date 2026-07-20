import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import subprocess
import tempfile
import threading
from typing import Any, cast
from urllib.parse import urlsplit

import yaml
from behave import given, then, when


class _FixtureServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self) -> None:
        super().__init__(("127.0.0.1", 0), _FixtureHandler)
        self.requests: list[dict[str, Any]] = []
        self.thread = threading.Thread(target=self.serve_forever, name="kraken-cli-fixture")
        self.thread.start()


class _FixtureHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        server = cast(_FixtureServer, self.server)
        server.requests.append({"method": "GET", "path": path, "body": None})
        if path == "/widgets/missing":
            self._json(404, {"message": "Widget not found"})
        elif path.startswith("/widgets/"):
            widget_id = path.removeprefix("/widgets/")
            self._json(200, {"id": widget_id, "name": "Keyboard", "quantity": 2})
        else:
            self._json(404, {"message": "Unknown fixture path"})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(length))
        path = urlsplit(self.path).path
        server = cast(_FixtureServer, self.server)
        server.requests.append({"method": "POST", "path": path, "body": body})
        self._json(
            201,
            {"id": "widget-123", "name": body["name"], "quantity": body["quantity"]},
        )

    def _json(self, status: int, payload: Any) -> None:
        encoded = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args: object) -> None:
        pass


def _openapi(title: str, operation_id: str, summary: str, path: str) -> dict[str, Any]:
    return {
        "openapi": "3.0.3",
        "info": {"title": title, "version": "1.0.0"},
        "paths": {
            path: {
                "get": {
                    "operationId": operation_id,
                    "summary": summary,
                    "responses": {
                        "200": {
                            "description": "Success",
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object"},
                                }
                            },
                        }
                    },
                }
            }
        },
    }


def _widgets_openapi() -> dict[str, Any]:
    return {
        "openapi": "3.0.3",
        "info": {"title": "Widgets API", "version": "1.0.0"},
        "paths": {
            "/widgets": {
                "post": {
                    "operationId": "createWidget",
                    "summary": "Create one resource",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CreateWidget"}
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "Created",
                            "content": {
                                "application/json": {"schema": {"$ref": "#/components/schemas/Widget"}}
                            },
                        }
                    },
                }
            },
            "/widgets/{widgetId}": {
                "get": {
                    "operationId": "getWidget",
                    "summary": "Get one resource",
                    "parameters": [
                        {
                            "name": "widgetId",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string", "minLength": 1},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Found",
                            "content": {
                                "application/json": {"schema": {"$ref": "#/components/schemas/Widget"}}
                            },
                        },
                        "404": {
                            "description": "Missing",
                            "content": {
                                "application/json": {"schema": {"$ref": "#/components/schemas/Error"}}
                            },
                        },
                    },
                }
            },
        },
        "components": {
            "schemas": {
                "CreateWidget": {
                    "type": "object",
                    "required": ["name", "quantity"],
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string", "minLength": 1},
                        "quantity": {"type": "integer", "minimum": 1},
                    },
                },
                "Widget": {
                    "type": "object",
                    "required": ["id", "name", "quantity"],
                    "additionalProperties": False,
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "quantity": {"type": "integer"},
                    },
                },
                "Error": {
                    "type": "object",
                    "required": ["message"],
                    "additionalProperties": False,
                    "properties": {"message": {"type": "string"}},
                },
            }
        },
    }


@given("an isolated Kraken CLI workspace with two API definitions")
def isolated_cli_workspace(context: Any) -> None:
    context.workspace = Path(tempfile.mkdtemp(prefix="kraken-cli-scenario-"))
    specs = context.workspace / "specs"
    specs.mkdir()
    (specs / "alpha.yaml").write_text(
        yaml.safe_dump(_openapi("Alpha API", "findWidget", "Find a widget", "/widget-search")),
        encoding="utf-8",
    )
    (specs / "zeta.yaml").write_text(
        yaml.safe_dump(_openapi("Zeta API", "listWidgets", "List widgets", "/widgets")),
        encoding="utf-8",
    )
    config = {
        "apis": {
            "zeta": {"spec": "./specs/zeta.yaml", "base_url": "http://127.0.0.1:9"},
            "alpha": {"spec": "./specs/alpha.yaml", "base_url": "http://127.0.0.1:9"},
        }
    }
    context.config_path = context.workspace / "kraken.yaml"
    context.config_path.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
    context.processes = []
    _start_execution_and_scenario(context)


@given("an isolated installed Kraken CLI with a local widgets API")
def isolated_widgets_cli(context: Any) -> None:
    _setup_widgets_cli_workspace(context)
    _start_execution_and_scenario(context)


@given("an isolated installed Kraken CLI workspace with a local widgets API")
def isolated_widgets_cli_workspace(context: Any) -> None:
    _setup_widgets_cli_workspace(context)


def _setup_widgets_cli_workspace(context: Any) -> None:
    context.workspace = Path(tempfile.mkdtemp(prefix="kraken-cli-scenario-"))
    context.kraken_server = _FixtureServer()
    spec_path = context.workspace / "widgets.yaml"
    spec_path.write_text(yaml.safe_dump(_widgets_openapi()), encoding="utf-8")
    context.spec_path = spec_path
    host, port = cast(tuple[str, int], context.kraken_server.server_address)
    context.config_path = context.workspace / "kraken.yaml"
    context.config_path.write_text(
        yaml.safe_dump(
            {"apis": {"widgets": {"spec": "./widgets.yaml", "base_url": f"http://{host}:{port}"}}},
            sort_keys=False,
        ),
        encoding="utf-8",
    )
    context.processes = []


def _run(
    context: Any,
    *arguments: str,
    stdin: str | None = None,
    timeout: int = 10,
) -> subprocess.CompletedProcess[str]:
    environment = {
        key: value
        for key, value in os.environ.items()
        if key not in {"KRAKEN_CONFIG", "KRAKEN_SESSION", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"}
    }
    environment["PYTHONPATH"] = context.kraken_dependency_path
    command = [
        str(context.kraken_executable),
        *arguments,
    ]
    try:
        result = subprocess.run(
            command,
            cwd=context.workspace,
            env=environment,
            input=stdin,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError as error:
        raise AssertionError(f"installed Kraken executable is missing: {context.kraken_executable}") from error
    context.processes.append({"argv": command, "result": result})
    return result


def _start_execution_and_scenario(context: Any) -> None:
    execution = _run(context, "execution", "start")
    _assert_exit(execution, 0)
    scenario = _run(context, "scenario", "start")
    _assert_exit(scenario, 0)


@when('I search for "{query}" in an installed Kraken process')
def search_installed_cli(context: Any, query: str) -> None:
    context.search_process = _run(context, "search", query)


@then("the search succeeds with operation references in deterministic order")
def search_has_stable_refs(context: Any) -> None:
    result = context.search_process
    assert result.returncode == 0, f"exit={result.returncode}\nstdout={result.stdout}\nstderr={result.stderr}"
    payload = json.loads(result.stdout)
    assert payload["ok"] is True
    assert payload["results"] == [
        {
            "ref": "@o1",
            "api": "alpha",
            "operation_id": "findWidget",
            "summary": "Find a widget",
        },
        {
            "ref": "@o2",
            "api": "zeta",
            "operation_id": "listWidgets",
            "summary": "List widgets",
        },
    ]
    assert result.stderr == ""
    context.first_operation_ref = payload["results"][0]["ref"]


@when("I describe the first operation reference in a separate installed Kraken process")
def describe_ref_in_new_process(context: Any) -> None:
    context.describe_process = _run(context, "describe", context.first_operation_ref)


@then("the description succeeds for that same referenced operation")
def description_has_ref_identity(context: Any) -> None:
    result = context.describe_process
    assert result.returncode == 0, f"exit={result.returncode}\nstdout={result.stdout}\nstderr={result.stderr}"
    payload = json.loads(result.stdout)
    assert payload["ok"] is True
    assert payload["ref"] == "@o1"
    assert payload["api"] == "alpha"
    assert payload["operation_id"] == "findWidget"
    assert result.stderr == ""


@when("I search one API with explicit contract and base URL overrides")
def search_with_overrides(context: Any) -> None:
    context.override_spec = context.workspace / "specs" / "alpha.yaml"
    context.override_base_url = "http://127.0.0.1:9"
    result = _run(
        context,
        "--api",
        "alpha",
        "--spec",
        str(context.override_spec),
        "--base-url",
        context.override_base_url,
        "search",
        "widget",
    )
    _assert_exit(result, 0)
    context.override_ref = json.loads(result.stdout)["results"][0]["ref"]


@then("I can describe its reference with the same overrides and no API option")
def describe_override_reference(context: Any) -> None:
    result = _run(
        context,
        "--spec",
        str(context.override_spec),
        "--base-url",
        context.override_base_url,
        "describe",
        context.override_ref,
    )
    _assert_exit(result, 0)
    payload = json.loads(result.stdout)
    assert payload["ref"] == context.override_ref
    assert payload["api"] == "alpha"
    assert result.stderr == ""


@when("I complete an execution flow using operation and response aliases")
def complete_execution_flow(context: Any) -> None:
    context.execution_start = _run(context, "execution", "start")
    _assert_exit(context.execution_start, 0)
    context.scenario_start = _run(context, "scenario", "start")
    _assert_exit(context.scenario_start, 0)

    search = _run(context, "search", "createWidget")
    _assert_exit(search, 0)
    context.flow_operation_ref = json.loads(search.stdout)["results"][0]["ref"]

    context.flow_describe = _run(context, "describe", context.flow_operation_ref)
    _assert_exit(context.flow_describe, 0)

    input_path = _write_input(
        context,
        "flow-create.json",
        {"body": {"name": "Keyboard", "quantity": 2}},
    )
    context.flow_invoke = _run(context, "invoke", context.flow_operation_ref, "--input", str(input_path))
    _assert_exit(context.flow_invoke, 0)
    context.flow_response_ref = json.loads(context.flow_invoke.stdout)["response_ref"]

    context.flow_resolve = _run(context, "resolve", context.flow_response_ref, "--pointer", "/id")
    _assert_exit(context.flow_resolve, 0)
    context.execution_finish = _run(context, "execution", "finish")
    _assert_exit(context.execution_finish, 0)


@then("the execution flow succeeds and removes local state")
def execution_flow_succeeds_and_finishes(context: Any) -> None:
    execution = json.loads(context.execution_start.stdout)
    assert execution["ok"] is True, execution
    assert execution["execution"] == "@e1", execution
    assert execution["state"] == "active", execution
    assert execution["config_path"] == str(context.config_path.resolve()), execution
    assert execution["store_path"] == str((context.workspace / ".kraken" / "execution.sqlite").resolve()), execution
    scenario = json.loads(context.scenario_start.stdout)
    assert scenario == {
        "ok": True,
        "scenario": "@s1",
        "status": "open",
    }, scenario
    assert context.flow_operation_ref == "@o1", context.flow_operation_ref

    description = json.loads(context.flow_describe.stdout)
    assert description["ok"] is True, description
    assert description["ref"] == "@o1", description
    assert description["api"] == "widgets", description
    assert description["operation_id"] == "createWidget", description

    invocation = json.loads(context.flow_invoke.stdout)
    assert invocation["ok"] is True, invocation
    assert invocation["ref"] == "@o1", invocation
    assert invocation["response_ref"] == "@r1", invocation
    assert invocation["data"]["id"] == "widget-123", invocation

    resolved = json.loads(context.flow_resolve.stdout)
    assert resolved == {
        "ok": True,
        "ref": "@r1",
        "api": "widgets",
        "operation_id": "createWidget",
        "value": "widget-123",
    }, resolved
    finish = json.loads(context.execution_finish.stdout)
    assert finish == {
        "ok": True,
        "removed": True,
        "closed_scenarios": 1,
    }, finish
    assert not (context.workspace / ".kraken" / "execution.sqlite").exists(), context.workspace
    for process in (
        context.execution_start,
        context.scenario_start,
        context.flow_describe,
        context.flow_invoke,
        context.flow_resolve,
        context.execution_finish,
    ):
        assert process.stderr == "", process


def _write_input(context: Any, name: str, payload: dict[str, Any]) -> Path:
    path = context.workspace / name
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def _assert_exit(result: subprocess.CompletedProcess[str], expected: int) -> None:
    assert result.returncode == expected, (
        f"exit={result.returncode}\nstdout={result.stdout}\nstderr={result.stderr}"
    )


@when("I invoke getWidget for a missing widget with matching assertions")
def invoke_documented_404(context: Any) -> None:
    input_path = _write_input(
        context,
        "matching-assertions.json",
        {
            "parameters": {"widgetId": "missing"},
            "assertions": {"status": 404, "body": {"/message": "Widget not found"}},
        },
    )
    context.result = _run(context, "--api", "widgets", "invoke", "getWidget", "--input", str(input_path))


@then("the documented 404 passes with compact assertion output")
def documented_404_is_compact(context: Any) -> None:
    _assert_exit(context.result, 0)
    assert json.loads(context.result.stdout) == {
        "ok": True,
        "api": "widgets",
        "operation_id": "getWidget",
        "status_code": 404,
        "assertions": {"total": 2, "passed": 2, "failed": 0},
    }
    assert context.result.stderr == ""


@when("I invoke getWidget with an assertion that does not match")
def invoke_failing_assertion(context: Any) -> None:
    input_path = _write_input(
        context,
        "failing-assertion.json",
        {
            "parameters": {"widgetId": "widget-123"},
            "assertions": {"status": 200, "body": {"/name": "Mouse"}},
        },
    )
    context.result = _run(context, "--api", "widgets", "invoke", "getWidget", "--input", str(input_path))


@then("only the unmatched assertion is returned on standard output")
def only_unmatched_is_returned(context: Any) -> None:
    _assert_exit(context.result, 7)
    payload = json.loads(context.result.stdout)
    assert payload == {
        "ok": False,
        "api": "widgets",
        "operation_id": "getWidget",
        "status_code": 200,
        "assertions": {
            "total": 2,
            "passed": 1,
            "failed": 1,
            "unmatched": [
                {
                    "kind": "body",
                    "pointer": "/name",
                    "expected": "Mouse",
                    "actual": {"present": True, "value": "Keyboard"},
                }
            ],
        },
    }
    assert "widget-123" not in context.result.stdout
    assert context.result.stderr == ""


@when("I invoke createWidget with a contract-invalid body")
def invoke_invalid_body(context: Any) -> None:
    context.kraken_server.requests.clear()
    input_path = _write_input(
        context,
        "invalid-body.json",
        {"body": {"name": "Keyboard", "quantity": 0}},
    )
    context.result = _run(context, "--api", "widgets", "invoke", "createWidget", "--input", str(input_path))


@then("request validation fails and the API receives no request")
def invalid_body_is_pretransport(context: Any) -> None:
    _assert_exit(context.result, 4)
    assert context.result.stdout == ""
    payload = json.loads(context.result.stderr)
    assert payload["ok"] is False
    assert payload["error"]["kind"] == "request_contract_violation"
    assert context.kraken_server.requests == []


@when("I discover an operation reference and clear the selected scenario state")
def discover_then_clear(context: Any) -> None:
    search = _run(context, "search", "createWidget")
    _assert_exit(search, 0)
    context.cleared_ref = json.loads(search.stdout)["results"][0]["ref"]
    cleared = _run(context, "refs", "clear")
    _assert_exit(cleared, 0)


@then("resolving the cleared operation reference fails as removed")
def cleared_ref_is_removed(context: Any) -> None:
    context.result = _run(context, "resolve", context.cleared_ref)
    _assert_exit(context.result, 8)
    assert context.result.stdout == ""
    assert json.loads(context.result.stderr)["error"]["kind"] == "reference_target_removed"


@when("I discover the operation again")
def rediscover_operation(context: Any) -> None:
    context.result = _run(context, "search", "createWidget")
    _assert_exit(context.result, 0)
    context.rediscovered_ref = json.loads(context.result.stdout)["results"][0]["ref"]


@then("the new operation reference has a higher number")
def ref_number_increases(context: Any) -> None:
    assert context.cleared_ref == "@o1"
    assert context.rediscovered_ref == "@o2"


def _discover_get_widget(context: Any) -> str:
    result = _run(context, "search", "getWidget")
    _assert_exit(result, 0)
    return cast(str, json.loads(result.stdout)["results"][0]["ref"])


@when("I invoke a discovered operation after its allowlist hides it")
def invoke_newly_disallowed_reference(context: Any) -> None:
    context.invalidated_ref = _discover_get_widget(context)
    config = yaml.safe_load(context.config_path.read_text(encoding="utf-8"))
    config["apis"]["widgets"]["allowed_operations"] = []
    context.config_path.write_text(yaml.safe_dump(config), encoding="utf-8")
    input_path = _write_input(
        context,
        "disallowed.json",
        {"parameters": {"widgetId": "must-not-send"}},
    )
    context.invalidated_result = _run(
        context,
        "invoke",
        context.invalidated_ref,
        "--input",
        str(input_path),
        "--no-state",
    )
    del config["apis"]["widgets"]["allowed_operations"]
    context.config_path.write_text(yaml.safe_dump(config), encoding="utf-8")


@then("the changed configuration fails before transport")
def changed_configuration_is_pretransport(context: Any) -> None:
    _assert_exit(context.invalidated_result, 8)
    assert context.kraken_server.requests == []
    assert json.loads(context.invalidated_result.stderr)["error"]["kind"] == "execution_config_changed"


@when("I invoke a discovered operation after its contract removes it")
def invoke_removed_reference(context: Any) -> None:
    context.invalidated_ref = _discover_get_widget(context)
    document = yaml.safe_load(context.spec_path.read_text(encoding="utf-8"))
    removed_path = document["paths"].pop("/widgets/{widgetId}")
    context.spec_path.write_text(yaml.safe_dump(document), encoding="utf-8")
    input_path = _write_input(
        context,
        "removed.json",
        {"parameters": {"widgetId": "must-not-send"}},
    )
    context.invalidated_result = _run(
        context,
        "invoke",
        context.invalidated_ref,
        "--input",
        str(input_path),
        "--no-state",
    )
    document["paths"]["/widgets/{widgetId}"] = removed_path
    context.spec_path.write_text(yaml.safe_dump(document), encoding="utf-8")


@then("the changed specification fails before transport")
def changed_specification_is_pretransport(context: Any) -> None:
    _assert_exit(context.invalidated_result, 8)
    assert json.loads(context.invalidated_result.stderr)["error"]["kind"] == "execution_config_changed"
    assert context.kraken_server.requests == []


@when("I create a widget and invoke getWidget using its response reference")
def chain_response_reference(context: Any) -> None:
    create_input = _write_input(
        context,
        "create.json",
        {"body": {"name": "Keyboard", "quantity": 2}},
    )
    created = _run(context, "--api", "widgets", "invoke", "createWidget", "--input", str(create_input))
    _assert_exit(created, 0)
    context.response_ref = json.loads(created.stdout)["response_ref"]
    get_input = _write_input(
        context,
        "chained.json",
        {
            "parameters": {
                "widgetId": {"$kraken_ref": context.response_ref, "pointer": "/id"}
            }
        },
    )
    context.result = _run(context, "--api", "widgets", "invoke", "getWidget", "--input", str(get_input))


@then("the later request contains the referenced widget identifier")
def chained_request_has_id(context: Any) -> None:
    _assert_exit(context.result, 0)
    assert context.response_ref == "@r1"
    assert context.kraken_server.requests[-1] == {
        "method": "GET",
        "path": "/widgets/widget-123",
        "body": None,
    }
    assert json.loads(context.result.stdout)["data"]["id"] == "widget-123"


@when("I invoke getWidget with response persistence disabled")
def invoke_without_state(context: Any) -> None:
    input_path = _write_input(context, "no-state.json", {"parameters": {"widgetId": "widget-123"}})
    context.result = _run(
        context,
        "--api",
        "widgets",
        "invoke",
        "getWidget",
        "--input",
        str(input_path),
        "--no-state",
    )


@then("the result reports no persisted response reference")
def no_state_has_no_response_ref(context: Any) -> None:
    _assert_exit(context.result, 0)
    payload = json.loads(context.result.stdout)
    assert "response_ref" not in payload
    assert payload["state"] == {"persisted": False, "reason": "no_state"}
    listed = _run(context, "refs", "list")
    _assert_exit(listed, 0)
    assert json.loads(listed.stdout)["references"] == []
