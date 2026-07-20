"""Local multi-API configuration for application-layer orchestration."""

from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

import yaml

from .errors import ConfigurationError


@dataclass(frozen=True)
class ApiDefinition:
    name: str
    spec_path: Path
    base_url: str
    allowed_operation_ids: frozenset[str] | None


@dataclass(frozen=True)
class KrakenConfig:
    path: Path
    apis: Mapping[str, ApiDefinition]


def load_config(path: Path) -> KrakenConfig:
    """Load YAML or JSON config, resolving specs from the config directory."""
    config_path = path.resolve()
    try:
        loaded = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, yaml.YAMLError) as error:
        raise ConfigurationError(f"Unable to load configuration: {config_path}") from error

    root = _mapping(loaded, "Configuration must be a mapping")
    raw_apis = _mapping(root.get("apis"), "Configuration 'apis' must be a mapping")
    definitions: dict[str, ApiDefinition] = {}
    for name, raw_definition in raw_apis.items():
        if not isinstance(name, str) or not name:
            raise ConfigurationError("API definition names must be non-empty strings")
        definition = _mapping(
            raw_definition,
            f"API definition '{name}' must be a mapping",
        )
        spec = _non_empty_string(definition.get("spec"), f"API definition '{name}' requires 'spec'")
        if "://" in spec:
            raise ConfigurationError(f"API definition '{name}' spec must be a local path")
        base_url = _non_empty_string(
            definition.get("base_url"),
            f"API definition '{name}' requires 'base_url'",
        )
        allowed_operation_ids = _allowed_operations(name, definition)
        spec_path = Path(spec)
        if not spec_path.is_absolute():
            spec_path = config_path.parent / spec_path
        definitions[name] = ApiDefinition(
            name=name,
            spec_path=spec_path.resolve(),
            base_url=base_url,
            allowed_operation_ids=allowed_operation_ids,
        )

    return KrakenConfig(path=config_path, apis=definitions)


def _mapping(value: object, message: str) -> Mapping[object, object]:
    if not isinstance(value, Mapping):
        raise ConfigurationError(message)
    return value


def _non_empty_string(value: object, message: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ConfigurationError(message)
    return value


def _allowed_operations(
    name: str,
    definition: Mapping[object, object],
) -> frozenset[str] | None:
    if "allowed_operations" not in definition:
        return None
    value = definition["allowed_operations"]
    if not isinstance(value, list) or not all(
        isinstance(operation_id, str) and operation_id for operation_id in value
    ):
        raise ConfigurationError(
            f"API definition '{name}' allowed_operations must be a list of non-empty strings"
        )
    return frozenset(value)
