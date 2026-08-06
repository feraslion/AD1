# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Database-Level Query Filtering Optimization]
**Learning:** Performing in-memory filtering (e.g., using JavaScript's `.filter()`) on complete database result sets fetched without query conditions creates a severe O(N) performance and memory bottleneck. Shifting filtering to database-level constraints using Drizzle ORM query builders (`where`, `and`, `or`, `eq`, `like`) avoids high CPU usage and memory overhead.
**Action:** Use conditional Drizzle query builders to filter rows at the SQL level before retrieving records into Node.js/Bun application memory.
