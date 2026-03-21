## 2024-03-21 - Composite Indexes for Filter+Sort Queries
**Learning:** In PostgreSQL, queries that filter by one field and sort by another (e.g., `WHERE childId = X ORDER BY at DESC`) require a composite index `@@index([childId, at])` to avoid expensive in-memory sorts. A simple index on `childId` is not enough for optimal performance on large datasets.
**Action:** Always check the `orderBy` clauses in Prisma queries and ensure the relevant fields are included in a composite index alongside the filtered fields.
