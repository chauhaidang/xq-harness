from collections.abc import Mapping
from pathlib import Path
import json

import yaml

from model.api_catalog import ApiSource

class FileApiSource(ApiSource):
    def load(self, path: Path) -> Mapping[str, object]:
        document = None
        with path.open("r", encoding="utf-8") as f:
            if path.suffix.lower() == ".json":
                document = json.load(f)
            elif path.suffix.lower() in [".yaml", ".yml"]:
                document = yaml.safe_load(f)
            else:
                raise ValueError("Unsupported api source file type:")

            if not isinstance(document, Mapping):
                raise ValueError("Unsupported api spec content! It is not a map")

            return document



