# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Fail-Fast Database Connection Probe during Schema Migration]
**Learning:** When executing multi-step database migrations or schema validations sequentially, catching connection errors inside retry loops can inadvertently mask offline database issues, causing subsequent queries to continuously block and time out. This adds significant delay and hangs test runners (timing out at 400s).
**Action:** Implement a fast `SELECT 1` connection probe at the very start of schema initialization and propagate a descriptive connection error (`ECONNREFUSED`) to skip all subsequent queries instantly.
