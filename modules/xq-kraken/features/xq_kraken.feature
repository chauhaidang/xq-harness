Feature: XQ Kraken OpenAPI adapters
  Functional behavior is expressed through caller-visible outcomes.

  Scenario Outline: Load a project-owned OpenAPI document
    Given an OpenAPI document stored as <format>
    When the file source loads the document
    Then the OpenAPI title is "Payments API"
    And the operation id is "listPayments"

    Examples:
      | format |
      | json   |
      | yaml   |

  Scenario: Invoke through the pinned dynamic OpenAPI library
    Given the project-owned widgets specification
    When getWidget is invoked through the pinned library
    Then the widget request and normalized response are valid

  Scenario: Reject an invalid request body before transport
    Given the project-owned widgets specification
    When an invalid createWidget body is validated
    Then validation fails before any request is sent
