# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Optimize Product Search Database-level Filtering]
**Learning:** Performing in-memory Javascript array filtering on large database tables like `products` inside `ProductRepository.findAll` introduces extreme memory/CPU and network bottleneck as the table size grows.
**Action:** Replace `list.filter(...)` blocks with Drizzle ORM's conditional `where`, `and`, `or`, and `ilike` operators to push filtering logic down to the PostgreSQL engine, reducing network load and Node.js memory overhead to $O(1)$ scaling.
