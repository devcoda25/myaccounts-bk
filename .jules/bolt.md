## 2026-05-08 - Composite Indexes for Chronological Queries
**Learning:** Queries that filter by an ID (like `childId`, `parentId`, `userId`) and order by a timestamp (`at`, `createdAt`) cause expensive in-memory sorts if only single-column indexes exist. B-Tree composite indexes naturally support these queries.
**Action:** Add composite indexes (e.g., `@@index([childId, at])`) to models with this access pattern to prevent filesorts.
