from pathlib import Path

import yaml
from workshop.assertions import raises


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


def test_loads_the_owned_spec_and_indexes_its_operations() -> None:
    from kraken.client import KrakenClient
    from kraken.dynamic_client import KrakenDynamicClient

    client: KrakenClient = KrakenDynamicClient.from_file(
        spec_path=SPEC_PATH,
        base_url="http://127.0.0.1:8765",
        allowed_operation_ids={"listWidgets", "getWidget", "createWidget"},
    )

    assert {item.operation_id for item in client.search("")} == {
        "listWidgets",
        "getWidget",
        "createWidget",
    }


def test_rejects_missing_or_duplicate_operation_ids(tmp_path: Path, defect: str) -> None:
    from kraken.dynamic_client import KrakenDynamicClient

    document = yaml.safe_load(SPEC_PATH.read_text())
    if defect == "missing":
        del document["paths"]["/widgets"]["get"]["operationId"]
    else:
        document["paths"]["/widgets"]["post"]["operationId"] = "listWidgets"
    invalid_spec = tmp_path / "invalid-openapi.yaml"
    invalid_spec.write_text(yaml.safe_dump(document))

    with raises(ValueError, match="operationId"):
        KrakenDynamicClient.from_file(
            spec_path=invalid_spec,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids=set(),
        )
