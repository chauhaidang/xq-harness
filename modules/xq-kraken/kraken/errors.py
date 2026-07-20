class KrakenError(Exception):
    """Base class for caller-visible Kraken failures."""

    def __init__(self, operation_id: str, message: str | None = None) -> None:
        self.operation_id = operation_id
        super().__init__(message or operation_id)


class ConfigurationError(Exception):
    """Raised when local Kraken configuration cannot be loaded safely."""


class OperationNotFoundError(KrakenError):
    """Raised when an operation is not found."""
    ...


class OperationNotAllowedError(KrakenError):
    pass


class InvocationError(KrakenError):
    pass


class InvocationValidationError(InvocationError):
    pass


class InvocationTransportError(InvocationError):
    pass


class InvocationHttpError(InvocationError):
    pass


class InvocationResponseError(InvocationError):
    pass
