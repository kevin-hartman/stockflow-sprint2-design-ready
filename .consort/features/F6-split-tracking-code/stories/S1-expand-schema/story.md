# S1 – Expand schema: add batch and serial columns

**As a** warehouse operator,
**I want** batch_number and serial_number extracted into their own columns (backfilled from inventory_code),
**so that** each tracking dimension is separately addressable and integrity can be verified before the combined code is retired.
