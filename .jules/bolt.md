# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Database-Level Product Query Optimization]
**Learning:** Retrieving an entire database table in memory and using JavaScript array helper methods (`Array.prototype.filter`) to perform category and string-matching filters can be incredibly slow and memory-intensive, especially for large datasets. Furthermore, replacing case-insensitive JS filters with standard PostgreSQL `like` operators causes case-sensitivity issues, which must be resolved by using the `ilike` operator.
**Action:** Leverage database-level query optimization by using Drizzle ORM's `where()`, `and()`, `or()`, and `ilike()` operators to execute case-insensitive matching directly on the database engine.
