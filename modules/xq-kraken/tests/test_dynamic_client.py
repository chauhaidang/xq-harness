import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

import yaml

from kraken.dynamic_client import KrakenDynamicClient
from kraken.errors import (
    InvocationTransportError,
    InvocationValidationError,
    OperationNotAllowedError,
    OperationNotFoundError,
)
from kraken.models import InvocationRequest


MODULE_ROOT = Path(__file__).parents[1]
SPEC_PATH = MODULE_ROOT / "tests" / "fixtures" / "widgets-openapi.yaml"


class DynamicClientTest(unittest.TestCase):
    def test_describes_an_operation_for_a_caller(self) -> None:
        client = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids={"getWidget"},
        )

        description = client.describe("getWidget")

        self.assertEqual(description.operation_id, "getWidget")
        self.assertEqual(description.method, "get")
        self.assertEqual(description.path, "/widgets/{widgetId}")
        self.assertEqual(
            [(parameter.name, parameter.location, parameter.required) for parameter in description.parameters],
            [("widgetId", "path", True)],
        )

    def test_describes_an_operation_request_body(self) -> None:
        client = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids={"createWidget"},
        )

        description = client.describe("createWidget")

        self.assertIsNotNone(description.request_body)
        assert description.request_body is not None
        self.assertTrue(description.request_body.required)
        self.assertIn("application/json", description.request_body.content)

    def test_rejects_describing_an_unknown_operation(self) -> None:
        client = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids=set(),
        )

        with self.assertRaises(OperationNotFoundError):
            client.describe("operationThatDoesNotExist")

    def test_operation_parameters_override_path_parameters_with_the_same_name_and_location(self) -> None:
        """OpenAPI operation parameters take precedence over path-item parameters."""
        document = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
        path_item = document["paths"]["/widgets/{widgetId}"]
        path_item["parameters"] = [
            {
                "name": "locale",
                "in": "query",
                "required": False,
                "description": "Path-item default locale.",
                "schema": {"type": "string"},
            }
        ]
        path_item["get"]["parameters"].append(
            {
                "name": "locale",
                "in": "query",
                "required": True,
                "description": "Operation-specific locale.",
                "schema": {"type": "string", "enum": ["en", "vi"]},
            }
        )

        description = self._describe_modified_get_widget(document)

        self.assertEqual(
            [(parameter.name, parameter.location, parameter.required, parameter.description) for parameter in description.parameters],
            [
                ("locale", "query", True, "Operation-specific locale."),
                ("widgetId", "path", True, None),
            ],
        )

    def test_path_parameter_is_required_even_when_the_raw_mapping_omits_required(self) -> None:
        """Kraken must present every path placeholder as required to callers."""
        document = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
        del document["paths"]["/widgets/{widgetId}"]["get"]["parameters"][0]["required"]

        description = self._describe_modified_get_widget(document)

        parameter = description.parameters[0]
        self.assertEqual((parameter.name, parameter.location), ("widgetId", "path"))
        self.assertTrue(parameter.required)

    def test_rejects_describing_an_operation_outside_the_allowlist(self) -> None:
        client = KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids={"getWidget"},
        )

        with self.assertRaises(OperationNotAllowedError):
            client.describe("createWidget")

    def test_rejects_a_missing_required_path_parameter_before_transport(self) -> None:
        """Invocation input must be validated even when no server is available."""
        client = self._client({"getWidget"})

        with self.assertRaises(InvocationValidationError):
            client.invoke(InvocationRequest(operation_id="getWidget"))

    def test_rejects_a_parameter_that_violates_the_openapi_schema_before_transport(self) -> None:
        """The OpenAPI schema, rather than Kraken-specific rules, owns validation."""
        client = self._client({"listWidgets"})

        with self.assertRaises(InvocationValidationError):
            client.invoke(
                InvocationRequest(operation_id="listWidgets", parameters={"limit": 0})
            )

    def test_rejects_a_missing_required_request_body_before_transport(self) -> None:
        client = self._client({"createWidget"})

        with self.assertRaises(InvocationValidationError):
            client.invoke(InvocationRequest(operation_id="createWidget"))

    def test_rejects_a_request_body_that_violates_the_openapi_schema_before_transport(self) -> None:
        client = self._client({"createWidget"})

        with self.assertRaises(InvocationValidationError):
            client.invoke(
                InvocationRequest(
                    operation_id="createWidget",
                    body={"name": "Keyboard", "quantity": 0},
                )
            )

    def test_rejects_invoking_an_unknown_operation(self) -> None:
        client = self._client(set())

        with self.assertRaises(OperationNotFoundError):
            client.invoke(InvocationRequest(operation_id="operationThatDoesNotExist"))

    def test_rejects_invoking_an_operation_outside_the_allowlist(self) -> None:
        client = self._client({"getWidget"})

        with self.assertRaises(OperationNotAllowedError):
            client.invoke(InvocationRequest(operation_id="createWidget"))

    def test_maps_an_unreachable_server_to_a_transport_error(self) -> None:
        client = self._client({"getWidget"})

        with self.assertRaises(InvocationTransportError):
            client.invoke(
                InvocationRequest(
                    operation_id="getWidget",
                    parameters={"widgetId": "widget-1"},
                )
            )

    @staticmethod
    def _client(allowed_operation_ids: set[str]) -> KrakenDynamicClient:
        # No listener is intentionally bound at this address.  Each validation
        # test therefore proves the adapter rejects invalid input before it can
        # attempt HTTP transport.
        return KrakenDynamicClient.from_file(
            spec_path=SPEC_PATH,
            base_url="http://127.0.0.1:8765",
            allowed_operation_ids=allowed_operation_ids,
        )

    def _describe_modified_get_widget(self, document: object):
        with TemporaryDirectory() as directory:
            spec_path = Path(directory) / "widgets-openapi.yaml"
            spec_path.write_text(yaml.safe_dump(document), encoding="utf-8")
            client = KrakenDynamicClient.from_file(
                spec_path=spec_path,
                base_url="http://127.0.0.1:8765",
                allowed_operation_ids={"getWidget"},
            )
            return client.describe("getWidget")


if __name__ == "__main__":
    unittest.main()
