from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from behave import then


@then("a fake client completes the Kraken workflow through the protocol")
def checkpoint_0(context: Any) -> None:
    from workshop.checkpoint_0 import test_defines_the_interface_before_the_openapi_adapter

    test_defines_the_interface_before_the_openapi_adapter()


@then("the dynamic client indexes all owned operations")
def checkpoint_1_index(context: Any) -> None:
    from workshop.checkpoint_1 import test_loads_the_owned_spec_and_indexes_its_operations

    test_loads_the_owned_spec_and_indexes_its_operations()


@then("a {defect} operation id is rejected")
def checkpoint_1_invalid(context: Any, defect: str) -> None:
    from workshop.checkpoint_1 import test_rejects_missing_or_duplicate_operation_ids

    with TemporaryDirectory() as directory:
        test_rejects_missing_or_duplicate_operation_ids(Path(directory), defect)


@then("callers can discover parameter and request body contracts")
def checkpoint_2(context: Any) -> None:
    from workshop.checkpoint_2 import test_searches_and_describes_the_catalog_for_a_caller

    test_searches_and_describes_the_catalog_for_a_caller()


@then("one allowlist controls search describe and invoke")
def checkpoint_3(context: Any) -> None:
    from workshop.checkpoint_3 import test_one_allowlist_controls_search_describe_and_invoke

    test_one_allowlist_controls_search_describe_and_invoke()


@then("invocation validates parameters and returns plain data")
def checkpoint_4(context: Any) -> None:
    from workshop.checkpoint_4 import test_invokes_an_operation_id_and_normalizes_the_response

    test_invokes_an_operation_id_and_normalizes_the_response()


@then("search describe validate invoke and normalize form one flow")
def checkpoint_5(context: Any) -> None:
    from workshop.checkpoint_5 import test_search_describe_validate_and_invoke_form_one_flow

    test_search_describe_validate_and_invoke_form_one_flow()
