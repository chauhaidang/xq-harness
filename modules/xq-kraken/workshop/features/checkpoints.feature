Feature: Build a contract-first dynamic Kraken client

  @checkpoint0
  Scenario: Define the caller interface before choosing an adapter
    Then a fake client completes the Kraken workflow through the protocol

  @checkpoint1
  Scenario: Load and index the owned specification
    Then the dynamic client indexes all owned operations

  @checkpoint1
  Scenario Outline: Reject an invalid operation id contract
    Then a <defect> operation id is rejected

    Examples:
      | defect    |
      | missing   |
      | duplicate |

  @checkpoint2
  Scenario: Search and describe the catalog
    Then callers can discover parameter and request body contracts

  @checkpoint3
  Scenario: Enforce visibility through one seam
    Then one allowlist controls search describe and invoke

  @checkpoint4
  Scenario: Invoke and normalize a response
    Then invocation validates parameters and returns plain data

  @checkpoint5
  Scenario: Complete the catalog-to-call flow
    Then search describe validate invoke and normalize form one flow
