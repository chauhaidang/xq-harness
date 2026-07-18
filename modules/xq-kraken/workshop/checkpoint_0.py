from collections.abc import Mapping


def test_defines_the_interface_before_the_openapi_adapter() -> None:
    from kraken.client import KrakenClient
    from kraken.models import (
        InvocationRequest,
        InvocationResult,
        OperationDescription,
        OperationSummary,
    )

    summary = OperationSummary(
        operation_id="getWidget",
        summary="Get one widget",
        tags=("widgets",),
    )
    description = OperationDescription(
        operation_id="getWidget",
        method="GET",
        path="/widgets/{widgetId}",
        summary="Get one widget",
        description=None,
        tags=("widgets",),
        parameters=(),
        request_body=None,
        responses=(),
    )
    result = InvocationResult(
        operation_id="getWidget",
        status_code=200,
        headers={"content-type": "application/json"},
        data={"id": "widget-1"},
    )

    class FakeKrakenClient:
        def search(self, query: str) -> tuple[OperationSummary, ...]:
            return (summary,) if query.casefold() in "get widget" else ()

        def describe(self, operation_id: str) -> OperationDescription:
            assert operation_id == "getWidget"
            return description

        def invoke(self, command: InvocationRequest) -> InvocationResult:
            assert command.operation_id == "getWidget"
            assert isinstance(command.parameters, Mapping)
            return result

    client: KrakenClient = FakeKrakenClient()

    selected = client.search("widget")[0]
    assert client.describe(selected.operation_id) == description
    assert client.invoke(InvocationRequest(operation_id=selected.operation_id)) == result
