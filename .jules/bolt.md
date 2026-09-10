## 2025-02-27 - [Session Indexing Optimization]
**Learning:** The `Session` model is queried by `userId` and sorted by `lastUsedAt` descending in `findActiveSessionsByUser`. Without a composite index, this query can become a bottleneck as the number of sessions grows, requiring in-memory sorting.
**Action:** Add a composite index `@@index([userId, lastUsedAt(sort: Desc)])` to the `Session` model to optimize this specific query pattern.
