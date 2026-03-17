## 2026-03-17 - [Database Indexes]
**Learning:** Prisma does not automatically create composite indexes for foreign keys + order by clauses. In PostgreSQL, missing these causes expensive in-memory sorts for common queries like finding a child's recent activities.
**Action:** Add explicit composite indexes (e.g., `@@index([childId, at])`) to models frequently queried by relation and sorted by timestamp to improve performance.
