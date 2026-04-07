## 2025-04-07 - Composite Indexes for Chronological Queries
**Learning:** PostgreSQL doesn't automatically index foreign keys, and sorting on unindexed fields after a filter (e.g., `WHERE childId = X ORDER BY at DESC`) causes expensive in-memory filesorts when data grows. Prisma requires explicit composite indexes (`@@index([childId, at])`) to optimize these common access patterns.
**Action:** Always add composite indexes for `[foreignKeyId, sortField]` on models with chronological query patterns.
