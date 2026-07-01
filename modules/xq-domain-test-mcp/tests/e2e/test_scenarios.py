from pathlib import Path

import pytest

from .runner import load_mapping, list_mapping_files, run_mapping


@pytest.mark.parametrize(
    "mapping_path",
    list_mapping_files(),
    ids=lambda path: Path(path).stem,
)
def test_testbed_mapping(mock_api_base_url: str, mapping_path: Path) -> None:
    mapping = load_mapping(mapping_path)
    run_mapping(mapping, mock_api_base_url=mock_api_base_url)
