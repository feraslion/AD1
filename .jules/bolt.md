# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Push-down Low Stock and Credit Limit Filters to SQL in NotificationRepository]
**Learning:** Selecting entire database tables into Node.js memory (`db.select().from(table)`) and applying `Array.prototype.filter` creates $O(N)$ network latency, memory bloat, and CPU overhead as tables grow.
**Action:** Always push down filter expressions (`lte(products.stock, products.minStock)` and `and(gt(customers.creditLimit, '0'), gte(customers.balance, customers.creditLimit))`) to SQL at the database query builder level, reducing data transferred and processed in memory from $O(N)$ to $O(K)$.
