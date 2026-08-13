# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Implement Database-Level Query Filters Over In-Memory Arrays]
**Learning:** Fetching whole tables (like `products`, `invoices`, or `treasury_transactions`) into Node.js memory and using `Array.prototype.filter()` is an anti-pattern that wastes I/O bandwidth, increases memory consumption, and degrades latency under scale.
**Action:** Always delegate filtering to the database level using Drizzle ORM operators (`and`, `or`, `eq`, `ilike`, `like`) in `.where()` clauses on the query builders.
