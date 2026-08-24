## 2025-02-28 - Composite Indexes
**Learning:** Models queried by userId and sorted chronologically require composite indexes to avoid in-memory sorts.
**Action:** Add @@index([userId, createdAt(sort: Desc)]) and @@index([userId, lastUsedAt(sort: Desc)]) to optimize these queries.
