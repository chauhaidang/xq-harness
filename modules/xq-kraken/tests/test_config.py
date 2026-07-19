import unittest
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from kraken.config import load_config


class ConfigTest(unittest.TestCase):
    def test_loads_json_and_preserves_a_non_empty_allowlist(self) -> None:
        with TemporaryDirectory() as directory:
            config_path = Path(directory) / "kraken.json"
            config_path.write_text(
                json.dumps(
                    {
                        "apis": {
                            "widgets": {
                                "spec": "widgets.json",
                                "base_url": "https://widgets.example",
                                "allowed_operations": ["getWidget", "listWidgets"],
                            }
                        }
                    }
                ),
                encoding="utf-8",
            )

            config = load_config(config_path)

        self.assertEqual(
            config.apis["widgets"].allowed_operation_ids,
            frozenset({"getWidget", "listWidgets"}),
        )

    def test_loads_multiple_yaml_api_definitions_relative_to_the_config(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            config_path = root / "config" / "kraken.yaml"
            config_path.parent.mkdir()
            config_path.write_text(
                """
apis:
  widgets:
    spec: ../specs/widgets.yaml
    base_url: http://localhost:8080
  payments:
    spec: ../specs/payments.json
    base_url: http://localhost:8090
    allowed_operations: []
""",
                encoding="utf-8",
            )

            config = load_config(config_path)

        self.assertEqual(tuple(config.apis), ("widgets", "payments"))
        self.assertEqual(
            config.apis["widgets"].spec_path,
            (config_path.parent / "../specs/widgets.yaml").resolve(),
        )
        self.assertIsNone(config.apis["widgets"].allowed_operation_ids)
        self.assertEqual(config.apis["payments"].allowed_operation_ids, frozenset())


if __name__ == "__main__":
    unittest.main()
