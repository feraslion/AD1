# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Optimize Purchase Record Assembly with Map Lookup]
**Learning:** Assembling purchase orders or requests and their line items by performing `.filter()` on child item arrays for each parent record introduces an $O(N \times M)$ nested array iteration bottleneck.
**Action:** Group child items into an in-memory `Map<string, any[]>` by parent ID prior to mapping parent records, enabling $O(1)$ item lookup and $O(N + M)$ overall assembly complexity.
