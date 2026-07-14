import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from collections.abc import Mapping

from model.api_catalog import ApiSource
from adapters.file_api_source import FileApiSource


def load_openapi_document(source: ApiSource, path: Path) -> Mapping[str, object]:
    """Exercise a source through the ApiSource duck-typed contract."""
    return source.load(path)


class FileApiSourceBehavior(unittest.TestCase):
    def test_given_openapi_file_path_when_loaded_then_document_is_returned(self):
        # Given an OpenAPI document persisted at a file path
        document = {
            "openapi": "3.0.3",
            "info": {"title": "Payments API", "version": "1.0.0"},
            "paths": {"/payments": {"get": {"operationId": "listPayments"}}},
        }

        with TemporaryDirectory() as directory:
            spec_path = Path(directory) / "openapi.json"
            spec_path.write_text(json.dumps(document), encoding="utf-8")

            # When the file path is passed through the ApiSource contract
            loaded = load_openapi_document(FileApiSource(), spec_path)

        # Then the OpenAPI mapping is returned unchanged
        self.assertEqual(loaded, document)

    def test_given_openapi_yaml_file_path_when_loaded_then_document_is_returned(self):
        # Given an OpenAPI document persisted as YAML
        yaml_document = """\
openapi: 3.0.3
info:
  title: Payments API
  version: 1.0.0
paths:
  /payments:
    get:
      operationId: listPayments
"""

        with TemporaryDirectory() as directory:
            spec_path = Path(directory) / "openapi.yaml"
            spec_path.write_text(yaml_document, encoding="utf-8")

            # When the YAML file path is passed through the ApiSource contract
            loaded = load_openapi_document(FileApiSource(), spec_path)

        # Then the YAML document is parsed into the expected mapping
        self.assertEqual(loaded["openapi"], "3.0.3")
        self.assertEqual(loaded["info"]["title"], "Payments API")
        self.assertEqual(
            loaded["paths"]["/payments"]["get"]["operationId"],
            "listPayments",
        )


if __name__ == "__main__":
    unittest.main()
