from pathlib import Path


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


def test_searches_and_describes_the_catalog_for_a_caller() -> None:
    from kraken.client import KrakenClient
    from kraken.dynamic_client import KrakenDynamicClient

    client: KrakenClient = KrakenDynamicClient.from_file(
        spec_path=SPEC_PATH,
        base_url="http://127.0.0.1:8765",
        allowed_operation_ids={"listWidgets", "getWidget", "createWidget"},
    )

    assert [item.operation_id for item in client.search("create")] == ["createWidget"]

    description = client.describe("getWidget")
    assert description.operation_id == "getWidget"
    assert [(item.name, item.location, item.required) for item in description.parameters] == [
        ("widgetId", "path", True)
    ]

    create = client.describe("createWidget")
    assert create.request_body is not None
    assert create.request_body.required is True
    assert "application/json" in create.request_body.content
