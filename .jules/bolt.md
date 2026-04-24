## 2024-05-18 - Missing Index on Sorting Field
**Learning:** The access pattern for `findActiveSessionsByUser` (and potentially others) filters by `userId` and sorts by `lastUsedAt`. Sorting on unindexed fields can cause expensive in-memory sorts on the database. B-Tree composite indexes in PostgreSQL naturally support `ORDER BY DESC`.
**Action:** Verify if `lastUsedAt` is indexed. If not, add a composite index `@@index([userId, lastUsedAt])` to `Session`, and check other models for similar access patterns.
