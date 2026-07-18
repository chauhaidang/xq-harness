import unittest
from pathlib import Path

import yaml


MODULE_ROOT = Path(__file__).parents[1]


class WorkshopAssetsTest(unittest.TestCase):
    def test_uses_the_project_owned_widgets_contract(self) -> None:
        document = yaml.safe_load((MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml").read_text())
        operation_ids = {
            operation["operationId"]
            for path_item in document["paths"].values()
            for method, operation in path_item.items()
            if method in {"get", "post", "put", "patch", "delete"}
        }
        self.assertEqual(document["info"]["title"], "XQ Kraken Workshop Widgets API")
        self.assertEqual(operation_ids, {"listWidgets", "getWidget", "createWidget"})

    def test_documents_and_checkpoint_exercises_are_complete(self) -> None:
        readme = (MODULE_ROOT / "README.md").read_text()
        guide = (MODULE_ROOT / "workshop.md").read_text()
        feature = (MODULE_ROOT / "workshop" / "features" / "checkpoints.feature").read_text()
        checkpoints = sorted((MODULE_ROOT / "workshop").glob("checkpoint_*.py"))
        self.assertIn("[Workshop](workshop.md)", readme)
        self.assertIn("[API catalog contract](API_CATALOG_CONTRACT.md)", readme)
        self.assertEqual([path.name for path in checkpoints], [f"checkpoint_{number}.py" for number in range(6)])
        for number, checkpoint in enumerate(checkpoints):
            if number:
                self.assertIn(f"## Checkpoint {number}:", guide)
            compile(checkpoint.read_text(), str(checkpoint), "exec")
        self.assertIn("The KrakenClient contract", guide)
        self.assertIn("Do not introduce an abstract base", guide)
        self.assertIn("Constructing a client is separate", guide)
        self.assertIn("How an LLM knows what payload to send", guide)
        self.assertIn("Kraken is **not OpenAPI rendered as JSON**", guide)
        for number in range(6):
            self.assertIn(f"@checkpoint{number}", feature)

    def test_project_uses_the_kraken_import_package(self) -> None:
        self.assertTrue((MODULE_ROOT / "kraken" / "__init__.py").is_file())
        self.assertFalse((MODULE_ROOT / "xq_kraken").exists())


if __name__ == "__main__":
    unittest.main()
