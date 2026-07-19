"""Application-layer orchestration for the operation-centric Kraken CLI."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Any, Literal, cast

from .config import ApiDefinition, KrakenConfig, load_config
from .dynamic_client import KrakenDynamicClient
from .errors import (
    ConfigurationError,
    InvocationResponseError,
    InvocationTransportError,
    InvocationValidationError,
    OperationNotAllowedError,
    OperationNotFoundError,
)
from .matching import MISSING, is_partial_match, resolve_json_pointer
from .models import InvocationRequest, InvocationResult, JsonValue, OperationDescription
from .reference_store import (
    ReferenceKind,
    ReferenceRecord,
    ReferenceStore,
    ReferenceStoreError,
    canonical_context,
    default_session_name,
    parse_reference,
    reference_store_path,
)


@dataclass(frozen=True)
class CommandOptions:
    command: str
    config: Path | None = None
    session: str | None = None
    pretty: bool = False
    api: str | None = None
    spec: Path | None = None
    base_url: str | None = None
    query: str | None = None
    target: str | None = None
    input_data: Mapping[str, JsonValue] | None = None
    no_state: bool = False
    refs_action: str | None = None
    pointer: str = ""


@dataclass(frozen=True)
class CommandOutcome:
    exit_code: int
    stream: Literal["stdout", "stderr"]
    payload: Mapping[str, Any]


class ApplicationError(RuntimeError):
    def __init__(
        self,
        kind: str,
        message: str,
        *,
        exit_code: int,
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.kind = kind
        self.exit_code = exit_code
        self.details = {} if details is None else details


class KrakenApplication:
    """Execute one parsed command against local configuration and state."""

    def __init__(self, *, cwd: Path, environ: Mapping[str, str]) -> None:
        self._cwd = cwd
        self._environ = environ

    def execute(self, options: CommandOptions) -> CommandOutcome:
        try:
            config_path = options.config or self._cwd / "kraken.yaml"
            config = load_config(config_path)
            self._validate_overrides(options)
            store = self._store(config, options)
            if options.command == "search":
                return self._search(config, store, options)
            if options.command == "describe":
                return self._describe(config, store, options)
            if options.command == "invoke":
                return self._invoke(config, store, options)
            if options.command == "refs":
                return self._refs(store, options)
            if options.command == "resolve":
                return self._resolve(config, store, options)
            raise ApplicationError("invalid_input", "Unknown command", exit_code=2)
        except ApplicationError:
            raise
        except ConfigurationError as error:
            raise ApplicationError("invalid_configuration", str(error), exit_code=2) from error
        except OperationNotAllowedError as error:
            raise ApplicationError(
                "operation_unavailable",
                str(error),
                exit_code=3,
                details={"operation_id": error.operation_id},
            ) from error
        except OperationNotFoundError as error:
            raise ApplicationError(
                "operation_not_found",
                str(error),
                exit_code=3,
                details={"operation_id": error.operation_id},
            ) from error
        except InvocationValidationError as error:
            raise ApplicationError(
                "request_contract_violation",
                str(error),
                exit_code=4,
                details={"operation_id": error.operation_id},
            ) from error
        except InvocationTransportError as error:
            raise ApplicationError(
                "transport_failure",
                str(error),
                exit_code=5,
                details={"operation_id": error.operation_id},
            ) from error
        except InvocationResponseError as error:
            raise ApplicationError(
                "response_contract_violation",
                str(error),
                exit_code=6,
                details={"operation_id": error.operation_id},
            ) from error
        except ReferenceStoreError as error:
            details = {"reference": error.reference} if error.reference is not None else {}
            raise ApplicationError(error.kind, str(error), exit_code=8, details=details) from error
        except ValueError as error:
            raise ApplicationError("invalid_input", str(error), exit_code=2) from error

    @staticmethod
    def _validate_overrides(options: CommandOptions) -> None:
        has_override = options.spec is not None or options.base_url is not None
        reference_supplies_api = options.target is not None and options.target.startswith("@")
        if has_override and options.api is None and not reference_supplies_api:
            raise ApplicationError(
                "invalid_input",
                "--spec and --base-url require --api",
                exit_code=2,
            )

    def _store(self, config: KrakenConfig, options: CommandOptions) -> ReferenceStore:
        session = (
            options.session
            or self._environ.get("KRAKEN_SESSION")
            or default_session_name(config.path)
        )
        context = canonical_context(
            config.path,
            spec_override=options.spec,
            base_url_override=options.base_url,
        )
        return ReferenceStore(
            reference_store_path(session, environ=self._environ),
            session,
            context,
        )

    def _search(
        self,
        config: KrakenConfig,
        store: ReferenceStore,
        options: CommandOptions,
    ) -> CommandOutcome:
        query = options.query if options.query is not None else ""
        definitions = self._definitions_for_search(config, options)
        found: list[dict[str, Any]] = []
        for definition in definitions:
            client = self._client(self._effective(definition, options))
            for summary in client.search(query):
                found.append(
                    {
                        "api": definition.name,
                        "operation_id": summary.operation_id,
                        "summary": summary.summary,
                    }
                )
        found.sort(key=lambda item: (item["api"], item["operation_id"]))
        for item in found:
            item["ref"] = store.allocate_operation(item["api"], item["operation_id"])
        return CommandOutcome(0, "stdout", {"ok": True, "results": found})

    def _describe(
        self,
        config: KrakenConfig,
        store: ReferenceStore,
        options: CommandOptions,
    ) -> CommandOutcome:
        target = self._required_target(options)
        definition, operation_id, reference = self._operation_target(config, store, options, target)
        try:
            description = self._client(self._effective(definition, options)).describe(operation_id)
        except OperationNotFoundError as error:
            if reference is not None:
                store.mark_operation_removed(reference)
                raise ApplicationError(
                    "reference_target_removed",
                    "Referenced operation no longer exists",
                    exit_code=8,
                    details={"reference": reference},
                ) from error
            raise
        except OperationNotAllowedError:
            if reference is not None:
                store.mark_operation_removed(reference, reason="disallowed")
            raise
        payload: dict[str, Any] = {
            "ok": True,
            "api": definition.name,
            "operation_id": operation_id,
            "description": _description_payload(description),
        }
        if reference is not None:
            payload["ref"] = reference
        return CommandOutcome(0, "stdout", payload)

    def _invoke(
        self,
        config: KrakenConfig,
        store: ReferenceStore,
        options: CommandOptions,
    ) -> CommandOutcome:
        target = self._required_target(options)
        definition, operation_id, operation_ref = self._operation_target(config, store, options, target)
        raw_input = options.input_data
        if raw_input is None:
            raise ApplicationError("invalid_input", "Invocation input is required", exit_code=2)
        parameters = raw_input.get("parameters", {})
        if not isinstance(parameters, Mapping):
            raise ApplicationError("invalid_input", "parameters must be an object", exit_code=2)
        assertions_present = "assertions" in raw_input
        assertions = self._parse_assertions(raw_input.get("assertions")) if assertions_present else None
        resolved_parameters = self._resolve_expressions(cast(JsonValue, dict(parameters)), store)
        resolved_body = self._resolve_expressions(raw_input.get("body"), store)
        if not isinstance(resolved_parameters, dict):
            raise ApplicationError("invalid_input", "parameters must resolve to an object", exit_code=2)
        client = self._client(self._effective(definition, options))
        try:
            result = client.invoke(
                InvocationRequest(
                    operation_id=operation_id,
                    parameters=resolved_parameters,
                    body=resolved_body,
                )
            )
        except OperationNotFoundError as error:
            if operation_ref is not None:
                store.mark_operation_removed(operation_ref)
                raise ApplicationError(
                    "reference_target_removed",
                    "Referenced operation no longer exists",
                    exit_code=8,
                    details={"reference": operation_ref},
                ) from error
            raise
        except OperationNotAllowedError:
            if operation_ref is not None:
                store.mark_operation_removed(operation_ref, reason="disallowed")
            raise
        evaluation = _evaluate_assertions(result, assertions, assertions_present)
        identity: dict[str, Any] = {
            "api": definition.name,
            "operation_id": operation_id,
            "status_code": result.status_code,
        }
        if operation_ref is not None:
            identity["ref"] = operation_ref
        if evaluation is not None:
            payload = {"ok": evaluation["failed"] == 0, **identity, "assertions": evaluation}
            return CommandOutcome(0 if evaluation["failed"] == 0 else 7, "stdout", payload)

        payload = {
            "ok": True,
            **identity,
            "headers": dict(result.headers),
            "data": result.data,
        }
        if options.no_state:
            payload["state"] = {"persisted": False, "reason": "no_state"}
        else:
            allocation = store.allocate_response(
                definition.name,
                operation_id,
                result.data,
                status_code=result.status_code,
                operation_ref=operation_ref,
            )
            payload["response_ref"] = allocation.ref
            payload["state"] = {
                "persisted": allocation.persisted,
                "reason": allocation.reason,
                "max_bytes": allocation.max_bytes,
            }
        return CommandOutcome(0, "stdout", payload)

    def _refs(self, store: ReferenceStore, options: CommandOptions) -> CommandOutcome:
        action = options.refs_action
        if action == "list":
            references = [_reference_payload(record) for record in store.list()]
            return CommandOutcome(0, "stdout", {"ok": True, "references": references})
        if action == "status":
            status = store.status()
            return CommandOutcome(
                0,
                "stdout",
                {
                    "ok": True,
                    "session": status.session,
                    "context": status.context,
                    "counts": {
                        "operations": status.active_operations,
                        "responses": status.active_responses,
                        "tombstones": status.tombstones,
                    },
                    "response_bytes": status.response_bytes,
                    "max_response_bytes": status.max_bytes,
                },
            )
        if action == "gc":
            result = store.gc()
            return CommandOutcome(0, "stdout", {"ok": True, **asdict(result)})
        if action == "clear":
            result = store.clear()
            return CommandOutcome(0, "stdout", {"ok": True, **asdict(result)})
        raise ApplicationError("invalid_input", "Unknown refs action", exit_code=2)

    def _resolve(
        self,
        config: KrakenConfig,
        store: ReferenceStore,
        options: CommandOptions,
    ) -> CommandOutcome:
        target = self._required_target(options)
        parsed = parse_reference(target)
        record = store.resolve(target)
        if parsed.kind is ReferenceKind.OPERATION:
            definition = config.apis.get(record.api)
            if definition is None:
                store.mark_operation_removed(target)
                raise ApplicationError(
                    "reference_target_removed",
                    "Referenced API definition no longer exists",
                    exit_code=8,
                    details={"reference": target},
                )
            try:
                self._client(self._effective(definition, options)).describe(record.operation_id)
            except OperationNotFoundError as error:
                store.mark_operation_removed(target)
                raise ApplicationError(
                    "reference_target_removed",
                    "Referenced operation no longer exists",
                    exit_code=8,
                    details={"reference": target},
                ) from error
            except OperationNotAllowedError:
                store.mark_operation_removed(target, reason="disallowed")
                raise
            return CommandOutcome(0, "stdout", {"ok": True, **_reference_payload(record)})
        selected = record.data
        if options.pointer:
            selected = resolve_json_pointer(cast(JsonValue, record.data), options.pointer)
            if selected is MISSING:
                raise ApplicationError(
                    "invalid_reference_pointer",
                    "Response pointer does not exist",
                    exit_code=8,
                    details={"reference": target, "pointer": options.pointer},
                )
        return CommandOutcome(
            0,
            "stdout",
            {
                "ok": True,
                "ref": record.ref,
                "kind": record.kind.value,
                "api": record.api,
                "operation_id": record.operation_id,
                "status_code": record.status_code,
                "data": selected,
            },
        )

    def _operation_target(
        self,
        config: KrakenConfig,
        store: ReferenceStore,
        options: CommandOptions,
        target: str,
    ) -> tuple[ApiDefinition, str, str | None]:
        if target.startswith("@"):
            if options.api is not None:
                raise ApplicationError(
                    "invalid_input",
                    "--api cannot be supplied with an operation reference",
                    exit_code=2,
                )
            parsed = parse_reference(target)
            if parsed.kind is not ReferenceKind.OPERATION:
                raise ApplicationError(
                    "reference_kind_mismatch",
                    "Expected an operation reference",
                    exit_code=8,
                    details={"reference": target},
                )
            record = store.resolve(target, expected_kind=ReferenceKind.OPERATION)
            definition = config.apis.get(record.api)
            if definition is None:
                store.mark_operation_removed(target)
                raise ApplicationError(
                    "reference_target_removed",
                    "Referenced API definition no longer exists",
                    exit_code=8,
                    details={"reference": target},
                )
            return definition, record.operation_id, target
        return self._select_definition(config, options.api), target, None

    @staticmethod
    def _required_target(options: CommandOptions) -> str:
        if options.target is None:
            raise ApplicationError("invalid_input", "A target is required", exit_code=2)
        return options.target

    @staticmethod
    def _select_definition(config: KrakenConfig, api: str | None) -> ApiDefinition:
        if api is not None:
            definition = config.apis.get(api)
            if definition is None:
                raise ApplicationError(
                    "unknown_api",
                    f"API definition '{api}' does not exist",
                    exit_code=2,
                    details={"api": api},
                )
            return definition
        if len(config.apis) != 1:
            raise ApplicationError(
                "api_required",
                "--api is required when multiple API definitions are configured",
                exit_code=2,
            )
        return next(iter(config.apis.values()))

    def _definitions_for_search(
        self,
        config: KrakenConfig,
        options: CommandOptions,
    ) -> tuple[ApiDefinition, ...]:
        if options.api is not None:
            return (self._select_definition(config, options.api),)
        return tuple(config.apis[name] for name in sorted(config.apis))

    def _effective(self, definition: ApiDefinition, options: CommandOptions) -> ApiDefinition:
        if options.spec is None and options.base_url is None:
            return definition
        if options.api is not None and options.api != definition.name:
            return definition
        spec_path = options.spec.resolve() if options.spec is not None else definition.spec_path
        return replace(
            definition,
            spec_path=spec_path,
            base_url=options.base_url or definition.base_url,
        )

    @staticmethod
    def _client(definition: ApiDefinition) -> KrakenDynamicClient:
        return KrakenDynamicClient.from_file(
            spec_path=definition.spec_path,
            base_url=definition.base_url,
            allowed_operation_ids=definition.allowed_operation_ids,
        )

    @staticmethod
    def _parse_assertions(value: object) -> tuple[int | None, Mapping[str, JsonValue]]:
        if not isinstance(value, Mapping):
            raise ApplicationError("invalid_input", "assertions must be an object", exit_code=2)
        status = value.get("status")
        if status is not None and (isinstance(status, bool) or not isinstance(status, int)):
            raise ApplicationError("invalid_input", "assertions.status must be an integer", exit_code=2)
        body = value.get("body", {})
        if not isinstance(body, Mapping) or not all(isinstance(pointer, str) for pointer in body):
            raise ApplicationError("invalid_input", "assertions.body must be an object", exit_code=2)
        return cast(int | None, status), cast(Mapping[str, JsonValue], body)

    def _resolve_expressions(self, value: JsonValue, store: ReferenceStore) -> JsonValue:
        if isinstance(value, list):
            return [self._resolve_expressions(item, store) for item in value]
        if isinstance(value, dict):
            if set(value) == {"$kraken_ref", "pointer"}:
                reference = value["$kraken_ref"]
                pointer = value["pointer"]
                if not isinstance(reference, str) or not isinstance(pointer, str):
                    raise ApplicationError(
                        "invalid_input",
                        "Reference expressions require string $kraken_ref and pointer values",
                        exit_code=2,
                    )
                record = store.resolve(reference, expected_kind=ReferenceKind.RESPONSE)
                selected = resolve_json_pointer(cast(JsonValue, record.data), pointer)
                if selected is MISSING:
                    raise ApplicationError(
                        "invalid_reference_pointer",
                        "Response pointer does not exist",
                        exit_code=8,
                        details={"reference": reference, "pointer": pointer},
                    )
                return cast(JsonValue, selected)
            return {key: self._resolve_expressions(item, store) for key, item in value.items()}
        return value


def _evaluate_assertions(
    result: InvocationResult,
    assertions: tuple[int | None, Mapping[str, JsonValue]] | None,
    assertions_present: bool,
) -> dict[str, Any] | None:
    if not assertions_present and 200 <= result.status_code < 300:
        return None
    status, body = assertions if assertions is not None else (None, {})
    unmatched: list[dict[str, Any]] = []
    total = len(body) + (1 if status is not None else 0)
    if status is not None:
        if result.status_code != status:
            unmatched.append(
                {"kind": "status", "expected": status, "actual": result.status_code}
            )
    elif not 200 <= result.status_code < 300:
        total += 1
        unmatched.append(
            {"kind": "status", "expected": "2xx", "actual": result.status_code}
        )
    for pointer, expected in body.items():
        actual = resolve_json_pointer(result.data, pointer)
        if actual is MISSING:
            unmatched.append(
                {
                    "kind": "body",
                    "pointer": pointer,
                    "expected": expected,
                    "actual": {"present": False},
                }
            )
        elif not is_partial_match(cast(JsonValue, actual), expected):
            unmatched.append(
                {
                    "kind": "body",
                    "pointer": pointer,
                    "expected": expected,
                    "actual": {"present": True, "value": actual},
                }
            )
    failed = len(unmatched)
    evaluation: dict[str, Any] = {"total": total, "passed": total - failed, "failed": failed}
    if unmatched:
        evaluation["unmatched"] = unmatched
    return evaluation


def _description_payload(description: OperationDescription) -> dict[str, Any]:
    value = asdict(description)
    value.pop("operation_id", None)
    return value


def _reference_payload(record: ReferenceRecord) -> dict[str, Any]:
    return {
        "ref": record.ref,
        "kind": record.kind.value,
        "api": record.api,
        "operation_id": record.operation_id,
        "created_at": record.created_at,
        "state": record.status.value,
    }
