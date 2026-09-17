# S1 – File stock

**As a** warehouse operator  
**I want to** file a stock level for a SKU at a location and retrieve it later  
**So that** I have a reliable record of what is on each shelf

## Scope

Submit a (sku, location, quantity, inventory_code) record via the UI; the record is persisted and readable. A second submission for the same (sku, location) pair updates in place — no duplicate, no error page.
