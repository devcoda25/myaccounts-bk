## 2024-06-24 - Missing composite indexes cause in-memory sorts
**Learning:** When using Prisma, nested includes that rely on sorting (e.g., `orderBy: { createdAt: 'desc' }`) require a composite index combining the foreign key and the sort field (e.g., `@@index([userId, createdAt])`) to avoid costly in-memory sorts.
**Action:** Always add composite indexes for models queried by relationship and sorted chronologically.
