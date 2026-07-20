from pathlib import Path
import shutil
import site
import subprocess
import sys
import tempfile
from typing import Any


MODULE_ROOT = Path(__file__).parents[1]


def before_all(context: Any) -> None:
    install_root = Path(tempfile.mkdtemp(prefix="kraken-cli-wheel-"))
    context.kraken_install_root = install_root
    dist = install_root / "dist"
    virtualenv = install_root / "venv"
    subprocess.run(
        ["uv", "build", "--wheel", "--out-dir", str(dist)],
        cwd=MODULE_ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    subprocess.run(
        [sys.executable, "-m", "venv", "--system-site-packages", str(virtualenv)],
        check=True,
        text=True,
        capture_output=True,
    )
    wheel = next(dist.glob("*.whl"))
    subprocess.run(
        [str(virtualenv / "bin" / "python"), "-m", "pip", "install", "--no-deps", str(wheel)],
        check=True,
        text=True,
        capture_output=True,
    )
    context.kraken_executable = virtualenv / "bin" / "kraken"
    context.kraken_dependency_path = site.getsitepackages()[0]


def after_all(context: Any) -> None:
    install_root = getattr(context, "kraken_install_root", None)
    if install_root is None:
        return
    if context.failed:
        print(f"retained installed-wheel artifact: {install_root}")
    else:
        shutil.rmtree(install_root)


def after_scenario(context: Any, scenario: Any) -> None:
    server = getattr(context, "kraken_server", None)
    if server is not None:
        server.shutdown()
        server.server_close()
        server.thread.join(timeout=5)
        assert not server.thread.is_alive(), "local Kraken fixture server did not stop"
    workspace = getattr(context, "workspace", None)
    if workspace is None:
        return
    if scenario.status == "failed":
        print(f"retained scenario artifact: {workspace}")
    else:
        shutil.rmtree(workspace)
