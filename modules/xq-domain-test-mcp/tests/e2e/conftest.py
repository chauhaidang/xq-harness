from collections.abc import Iterator

import pytest

from testbed.mock_api.server import serve


@pytest.fixture
def mock_api_base_url() -> Iterator[str]:
    with serve(host="127.0.0.1", port=0) as base_url:
        yield base_url
