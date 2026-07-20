import unittest

from kraken.matching import (
    MISSING,
    evaluate_body_assertions,
    is_partial_match,
    resolve_json_pointer,
)
from kraken.models import JsonValue


class JsonPointerTest(unittest.TestCase):
    def test_resolves_rfc6901_escapes_array_indexes_and_missing_values(self) -> None:
        document: JsonValue = {"a/b": {"~key": [{"value": None}]}}

        self.assertIs(resolve_json_pointer(document, ""), document)
        self.assertIsNone(resolve_json_pointer(document, "/a~1b/~0key/0/value"))
        self.assertIs(resolve_json_pointer(document, "/a~1b/~0key/1"), MISSING)


class PartialMatchTest(unittest.TestCase):
    def test_matches_array_subsets_order_independently_with_distinct_consumption(self) -> None:
        actual = [{"id": 1, "kind": "a"}, {"id": 1, "kind": "b"}, {"id": 2}]

        self.assertTrue(
            is_partial_match(actual, [{"id": 1}, {"id": 1, "kind": "a"}])
        )
        self.assertFalse(is_partial_match([1], [1, 1]))

    def test_recursively_matches_object_subsets_and_json_number_types(self) -> None:
        actual = {"owner": {"name": "Ada", "active": True}, "count": 1.0, "extra": None}

        self.assertTrue(is_partial_match(actual, {"owner": {"name": "Ada"}, "count": 1}))
        self.assertFalse(is_partial_match(actual, {"owner": {"active": 1}}))

    def test_reports_only_unmatched_fields_with_explicit_missing_values(self) -> None:
        failures = evaluate_body_assertions(
            {"items": [{"id": "first"}, {"id": "second"}]},
            {"/items/0/id": "second", "/items/2": None, "/items": [{"id": "second"}]},
        )

        self.assertEqual([failure.pointer for failure in failures], ["/items/0/id", "/items/2"])
        self.assertEqual(failures[0].actual, "first")
        self.assertIs(failures[1].actual, MISSING)


if __name__ == "__main__":
    unittest.main()
