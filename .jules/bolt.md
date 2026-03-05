# Bolt's Performance Journal

## 2024-05-14 - Prisma Database Queries Require Composite Indexes for Sorting
**Learning:** A common query pattern in this codebase involves filtering by a related ID (e.g., `userId`, `childId`) and sorting by a timestamp (e.g., `createdAt`, `at`, `lastUsedAt`), which necessitates composite indexes for optimal performance in PostgreSQL to avoid expensive in-memory sorts.
**Action:** Always check `orderBy` statements in queries and ensure corresponding composite indexes (e.g., `@@index([userId, createdAt])`) are added to the Prisma schema.
