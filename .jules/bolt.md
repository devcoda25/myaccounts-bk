## 2025-02-28 - Prisma Composite Indexes for Performance
**Learning:** Prisma and PostgreSQL do not automatically create composite indexes for queries filtering by a foreign key and sorting by a timestamp (e.g., `userId` and `createdAt`), leading to potential performance bottlenecks for these common access patterns.
**Action:** When creating or optimizing models with queries that filter by an ID and sort by a timestamp, ensure a composite index like `@@index([userId, createdAt])` is explicitly added to the Prisma schema to support optimal performance.
