class HarnessStateError(Exception):
    """Base error for all harness-state failures."""


class NotInitializedError(HarnessStateError):
    """Raised when an operation requires an initialized state database."""


class EntityNotFoundError(HarnessStateError):
    """Raised when a requested entity does not exist in a projection table."""


class UnknownEntityTypeError(HarnessStateError):
    """Raised when a caller asks for an entity type the harness does not track."""
