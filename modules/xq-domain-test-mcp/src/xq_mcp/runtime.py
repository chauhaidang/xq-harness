from dataclasses import dataclass


class MissingRuntimeConfigError(RuntimeError):
    """Raised when a REST tool runs before environment configuration."""


@dataclass(frozen=True)
class RuntimeConfig:
    environment: str
    api_base_url: str
    api_token: str | None = None

    def redacted(self) -> dict[str, object]:
        return {
            "configured": True,
            "environment": self.environment,
            "api_base_url": self.api_base_url,
            "has_api_token": self.api_token is not None,
        }


class RuntimeState:
    def __init__(self) -> None:
        self._config: RuntimeConfig | None = None

    def configure(
        self,
        *,
        environment: str,
        api_base_url: str,
        api_token: str | None = None,
    ) -> dict[str, object]:
        if not environment.strip():
            raise ValueError("environment is required")
        if not api_base_url.strip():
            raise ValueError("api_base_url is required")

        config = RuntimeConfig(
            environment=environment,
            api_base_url=api_base_url.rstrip("/"),
            api_token=api_token,
        )
        self._config = config
        return {"status": "configured", **config.redacted()}

    def status(self) -> dict[str, object]:
        if self._config is None:
            return {"configured": False}
        return self._config.redacted()

    def clear(self) -> dict[str, object]:
        was_configured = self._config is not None
        self._config = None
        return {
            "status": "cleared",
            "was_configured": was_configured,
            "configured": False,
        }

    def require_config(self) -> RuntimeConfig:
        if self._config is None:
            raise MissingRuntimeConfigError(
                "Runtime environment is not configured. Call configure_environment first."
            )
        return self._config


runtime_state = RuntimeState()
