from python_example import __version__


def test_version() -> None:
    print(__version__)
    assert __version__ == "0.1.0"
