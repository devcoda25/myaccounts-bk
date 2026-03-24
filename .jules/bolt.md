## 2026-03-24 - Missing Composite Indexes for Foreign Key + Sort Queries
**Learning:** In PostgreSQL, Prisma does not automatically index foreign keys, and queries filtering by a foreign key (e.g., `userId`) while ordering by a timestamp (e.g., `createdAt` DESC) require a B-Tree composite index to prevent expensive in-memory sorts.
**Action:** Always add composite indexes like `@@index([userId, createdAt])` to models that are frequently fetched and sorted by timestamp for a specific relation.
