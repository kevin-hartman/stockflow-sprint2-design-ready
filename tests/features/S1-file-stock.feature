Feature: File Stock – retrieve AC2 (T10-T12, T15-T19)

  # T10
  Scenario: Happy-path read-back returns exact quantity and inventory_code
    Given a unique SKU and location for this run
    When I file a stock record with quantity 42 and inventory_code "IC-ALPHA"
    And I retrieve the stock record by sku and location
    Then the response quantity is 42
    And the response inventory_code is "IC-ALPHA"

  # T11
  Scenario: Same SKU at two different locations yields two independent records
    Given a unique SKU and two distinct locations for this run
    When I file the SKU at location A with quantity 10 and inventory_code "IC-A"
    And I file the SKU at location B with quantity 20 and inventory_code "IC-B"
    And I retrieve the stock record for location A
    Then the response quantity is 10 and inventory_code is "IC-A"
    When I retrieve the stock record for location B
    Then the response quantity is 20 and inventory_code is "IC-B"

  # T12
  Scenario: Re-filing the same sku+location pair updates the quantity in place
    Given a unique SKU and location for re-file
    When I file a stock record with quantity 5 and inventory_code "IC-ORIG"
    And I file the same sku and location again with quantity 99 and inventory_code "IC-NEW"
    And I retrieve the stock record by sku and location
    Then the response quantity is 99
    And the response inventory_code is "IC-NEW"

  # T15
  Scenario: Negative quantity returns 4xx naming quantity
    When I POST a file-stock payload with quantity -1
    Then the response is 4xx
    And the error detail names field "quantity"

  # T16
  Scenario: Missing sku field returns 4xx naming sku
    When I POST a file-stock payload omitting field "sku"
    Then the response is 4xx
    And the error detail names field "sku"

  # T17
  Scenario: Missing location field returns 4xx naming location
    When I POST a file-stock payload omitting field "location"
    Then the response is 4xx
    And the error detail names field "location"

  # T18
  Scenario: Missing inventory_code field returns 4xx naming inventory_code
    When I POST a file-stock payload omitting field "inventory_code"
    Then the response is 4xx
    And the error detail names field "inventory_code"

  # T19
  Scenario: Missing quantity field returns 4xx naming quantity
    When I POST a file-stock payload omitting field "quantity"
    Then the response is 4xx
    And the error detail names field "quantity"
