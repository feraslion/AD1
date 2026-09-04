# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Push Product Filtering to SQL Database Engine]
**Learning:** Fetching all products from the database (`db.select().from(products)`) and performing JavaScript `Array.prototype.filter` for category and search term filters creates high memory usage and unnecessary network/data payload transfer as product catalog size grows.
**Action:** Use Drizzle ORM operators (`eq`, `like`, `or`, `and`) directly in `ProductRepository.findAll` to push filtering conditions to the database query engine.
