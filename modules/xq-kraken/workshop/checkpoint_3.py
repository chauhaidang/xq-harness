from pathlib import Path

from workshop.assertions import raises


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


def test_one_allowlist_controls_search_describe_and_invoke() -> None:
    from kraken.client import KrakenClient
    from kraken.dynamic_client import KrakenDynamicClient
    from kraken.errors import OperationNotAllowedError, OperationNotFoundError
    from kraken.models import InvocationRequest

    client: KrakenClient = KrakenDynamicClient.from_file(
        spec_path=SPEC_PATH,
        base_url="http://127.0.0.1:1",
        allowed_operation_ids={"getWidget"},
    )

    assert [item.operation_id for item in client.search("")] == ["getWidget"]

    with raises(OperationNotAllowedError):
        client.describe("createWidget")

    with raises(OperationNotFoundError):
        client.describe("operationThatDoesNotExist")

    with raises(OperationNotAllowedError):
        client.invoke(InvocationRequest(operation_id="createWidget"))
