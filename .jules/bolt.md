# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Batch-writing Offline Queue state to LocalStorage]
**Learning:** Repeatedly reading, parsing, filtering, and writing (stringifying) localStorage queue states for every successfully processed offline item inside an asynchronous loop introduces an $O(N^2)$ storage and serialization bottleneck that can freeze the browser main thread.
**Action:** Sync elements asynchronously first, track successful syncs in a temporary Set/array, and write the remaining queue back to localStorage exactly once at the end of the sync cycle.
