from typing import Protocol

from .models import (
    InvocationRequest,
    InvocationResult,
    OperationDescription,
    OperationSummary,
)


class KrakenClient(Protocol):
    def search(self, query: str) -> tuple[OperationSummary, ...]: ...

    def describe(self, operation_id: str) -> OperationDescription: ...

    def invoke(self, request: InvocationRequest) -> InvocationResult: ...
