import copy
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, cast

import httpx
import yaml
from aiopenapi3 import OpenAPI
from behave import given, then, when
from kraken.file_api_source import FileApiSource
from pydantic import BaseModel, ValidationError


ROOT = Path(__file__).parents[2]
SPEC_PATH = ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


@given("an OpenAPI document stored as {format}")
def given_openapi_document(context: Any, format: str) -> None:
    context.format = format
    context.document = {
        "openapi": "3.0.3",
        "info": {"title": "Payments API", "version": "1.0.0"},
        "paths": {"/payments": {"get": {"operationId": "listPayments"}}},
    }


@when("the file source loads the document")
def load_document(context: Any) -> None:
    with TemporaryDirectory() as directory:
        path = Path(directory) / f"openapi.{context.format}"
        content = json.dumps(context.document) if context.format == "json" else yaml.safe_dump(context.document)
        path.write_text(content, encoding="utf-8")
        context.loaded = FileApiSource().load(path)


@then('the OpenAPI title is "{title}"')
def assert_title(context: Any, title: str) -> None:
    assert context.loaded["info"]["title"] == title


@then('the operation id is "{operation_id}"')
def assert_operation_id(context: Any, operation_id: str) -> None:
    assert context.loaded["paths"]["/payments"]["get"]["operationId"] == operation_id


@given("the project-owned widgets specification")
def build_api(context: Any) -> None:
    document = yaml.safe_load(SPEC_PATH.read_text())
    document = copy.deepcopy(document)
    document["servers"] = [{"url": "https://widgets.example.test"}]
    context.requests = []

    def handler(request: httpx.Request) -> httpx.Response:
        context.requests.append(request)
        return httpx.Response(200, headers={"Content-Type": "application/json"}, json={"id": "widget-1", "name": "Keyboard", "quantity": 2})

    transport = httpx.MockTransport(handler)

    def session_factory(**kwargs: Any) -> httpx.Client:
        return httpx.Client(transport=transport, **kwargs)

    context.api = OpenAPI(SPEC_PATH.resolve().as_uri(), document, session_factory=session_factory, use_operation_tags=False)
    print(f"api info: {context.api.info.schema_json(indent=2, by_alias=True)}")


@when("getWidget is invoked through the pinned library")
def invoke_widget(context: Any) -> None:
    _headers, context.data, context.response = context.api.createRequest("getWidget").request(parameters={"widgetId": "widget-1"})


@then("the widget request and normalized response are valid")
def assert_widget_result(context: Any) -> None:
    assert str(context.requests[0].url) == "https://widgets.example.test/widgets/widget-1"
    assert context.response.status_code == 200
    assert json.loads(context.data.model_dump_json()) == {"id": "widget-1", "name": "Keyboard", "quantity": 2}


@when("an invalid createWidget body is validated")
def validate_bad_body(context: Any) -> None:
    body_schema = context.api.createRequest("createWidget").data
    assert body_schema is not None
    body_type = cast(type[BaseModel], body_schema.get_type())
    try:
        body_type.model_validate({"name": "Keyboard", "quantity": 0})
    except ValidationError:
        context.validation_failed = True
    else:
        context.validation_failed = False


@then("validation fails before any request is sent")
def assert_pretransport_failure(context: Any) -> None:
    assert context.validation_failed
    assert context.requests == []
