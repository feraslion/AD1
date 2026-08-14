# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Batch Customer Invoices Fetching in Debt Aging Analysis]
**Learning:** Fetching customer invoices individually per debtor customer inside `CustomerRepository.getDebtAging()` introduced an $N+1$ database query bottleneck that slowed down customer debt aging analysis.
**Action:** Filter debtor customers first and batch fetch all their invoices in a single query using `inArray(invoices.customerId, debtorIds)`. Group invoices by `customerId` in memory using a `Map` lookup to cut DB roundtrips from $O(N)$ down to $O(1)$.
