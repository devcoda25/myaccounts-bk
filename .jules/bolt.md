
## 2024-03-30 - [Prisma Postgres Sorting Optimization]
**Learning:** Prisma does not automatically create composite indexes for foreign keys coupled with timestamp fields, leading to potentially expensive in-memory sorts for common chronological access patterns (e.g., `orderBy: { createdAt: 'desc' }`).
**Action:** Always verify access patterns of models against `schema.prisma` and explicitly define `@@index([foreignKeyId, sortField])` to prevent performance bottlenecks on large tables.
