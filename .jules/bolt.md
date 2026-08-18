# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Optimize Customer Debt Aging Report N+1 Queries]
**Learning:** Issuing individual invoice queries for each debtor customer inside a loop in `CustomerRepository.getDebtAging` causes an $N+1$ database query bottleneck on accounts receivable reporting.
**Action:** Batch-fetch all relevant invoices for debtor customers in a single query using Drizzle ORM's `inArray` operator and map them by `customerId` in memory, reducing database roundtrips from $O(N)$ to $O(1)$ query.
