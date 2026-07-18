from collections.abc import Iterator
from contextlib import contextmanager
from re import search


@contextmanager
def raises(error_type: type[BaseException], match: str | None = None) -> Iterator[None]:
    try:
        yield
    except error_type as error:
        if match is not None:
            assert search(match, str(error)), f"{error!r} does not match {match!r}"
    else:
        raise AssertionError(f"expected {error_type.__name__}")
