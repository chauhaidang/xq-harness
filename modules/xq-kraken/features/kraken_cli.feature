Feature: Kraken installed command-line interface
  Canonical CLI behavior is exercised through separate wheel-installed processes.

  @gate_a
  Scenario: Search references remain usable by a later process
    Given an isolated Kraken CLI workspace with two API definitions
    When I search for "widget" in an installed Kraken process
    Then the search succeeds with operation references in deterministic order
    When I describe the first operation reference in a separate installed Kraken process
    Then the description succeeds for that same referenced operation

  Scenario: Operation references preserve command-line override context
    Given an isolated Kraken CLI workspace with two API definitions
    When I search one API with explicit contract and base URL overrides
    Then I can describe its reference with the same overrides and no API option

  Scenario: Documented responses support focused assertions
    Given an isolated installed Kraken CLI with a local widgets API
    When I invoke getWidget for a missing widget with matching assertions
    Then the documented 404 passes with compact assertion output
    When I invoke getWidget with an assertion that does not match
    Then only the unmatched assertion is returned on standard output

  Scenario: Invalid request bodies fail before transport
    Given an isolated installed Kraken CLI with a local widgets API
    When I invoke createWidget with a contract-invalid body
    Then request validation fails and the API receives no request

  Scenario: Cleared operation references stay unusable and are not recycled
    Given an isolated installed Kraken CLI with a local widgets API
    When I discover an operation reference and clear the reference session
    Then resolving the cleared operation reference fails as removed
    When I discover the operation again
    Then the new operation reference has a higher number

  Scenario: A newly disallowed operation reference is permanently invalidated
    Given an isolated installed Kraken CLI with a local widgets API
    When I invoke a discovered operation after its allowlist hides it
    Then the unavailable operation sends no request and its reference stays tombstoned

  Scenario: A removed operation reference is permanently invalidated
    Given an isolated installed Kraken CLI with a local widgets API
    When I invoke a discovered operation after its contract removes it
    Then the removed target sends no request and its reference stays tombstoned

  Scenario: A response reference supplies a typed parameter to a later process
    Given an isolated installed Kraken CLI with a local widgets API
    When I create a widget and invoke getWidget using its response reference
    Then the later request contains the referenced widget identifier

  Scenario: No-state invocation does not allocate a response reference
    Given an isolated installed Kraken CLI with a local widgets API
    When I invoke getWidget with response persistence disabled
    Then the result reports no persisted response reference
