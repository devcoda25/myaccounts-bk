## 2026-06-24 - Adding Composite Indexes for Sorted Queries
**Learning:** Models frequently queried by foreign keys (e.g., userId, childId) and ordered chronologically require composite indexes (e.g., `@@index([userId, createdAt])`) to avoid expensive in-memory database sorts.
**Action:** Always add appropriate composite indexes to models whenever `findMany` queries are written with `where` and `orderBy` clauses.
