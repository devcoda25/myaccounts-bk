## 2024-05-16 - [Performance] Composite Indexes for Chronological Queries
**Learning:** In PostgreSQL, queries that filter by a parent ID and sort by a timestamp (e.g., `findManyByChildId` ordering by `at` desc) can result in expensive in-memory filesorts if only single-column indexes are present.
**Action:** Always add composite indexes (e.g., `@@index([userId, createdAt])`) to models that have frequent chronological access patterns bounded by a parent relation.
