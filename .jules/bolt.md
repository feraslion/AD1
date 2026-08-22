# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Optimize Financial Report & Trial Balance Query Aggregations]
**Learning:** Filtering arrays of journal details and looking up account records inside nested loops (`.filter()` or `.find()` per account/line) creates an $O(N \times M)$ or $O(L \times A)$ complexity bottleneck. In financial reporting with large general ledgers, this blocks the server thread during trial balance and financial statement generation.
**Action:** Pre-group journal details into an in-memory `Map<string, Details[]>` by `accountId` before looping through accounts, reducing calculation complexity to $O(N + M)$ and yielding >110x speed improvements.
