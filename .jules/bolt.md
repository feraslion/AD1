# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Pre-group Stock Moves for Inventory FIFO Valuation]
**Learning:** Filtering and sorting the complete stock moves dataset for every individual product inside `getInventoryValuation` created an $O(N \times M \log M)$ nested calculation bottleneck.
**Action:** Pre-group inward stock moves by `productId` into an in-memory `Map` and pre-sort each product array once, reducing execution time to $O(M \log M + N)$ and eliminating redundant array allocations/sorts.
