# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Database-Level Filtering vs In-Memory Query Post-Processing]
**Learning:** Loading entire database tables/collections (such as products or invoices) into Node.js memory and then filtering using JavaScript's `.filter()` introduces significant memory allocation overhead, locks the event loop, and scales poorly. Performing database-level filtering with query builders (like Drizzle ORM's `where()`) ensures minimal network payloads and extremely fast execution.
**Action:** Always write database queries to filter records using appropriate `where()`, `and()`, `or()`, and `like()` conditions in the database instead of loading the entire dataset into memory.

## 2025-03-06 - [Batching Synchronous localStorage Persistence to Minimize Blocking]
**Learning:** Calling synchronous blocking APIs like `localStorage.setItem` within a synchronization loop results in $O(N)$ stringification and disk I/O operations, causing severe main-thread lag in the user interface.
**Action:** Collect successful operations in a memory-based Set or Array, and update/persist the remaining elements to `localStorage` exactly once at the end of the batch process.
