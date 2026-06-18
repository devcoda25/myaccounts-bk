## 2024-05-18 - Missing Composite Indexes for Chronological Queries
**Learning:** Prisma models often query by a foreign key (like `userId` or `childId`) and sort by a timestamp (`createdAt`, `at`, `lastUsedAt`). Without a composite index `@@index([fk, timestamp])`, Postgres performs expensive in-memory filesorts.
**Action:** Always add composite indexes for these chronological query patterns to ensure scalable performance.
