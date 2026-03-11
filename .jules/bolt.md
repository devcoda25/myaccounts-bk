
## 2025-03-11 - Database Missing Composite Indexes
**Learning:** Prisma does not automatically index foreign key columns in PostgreSQL. Coupled with common access patterns in this codebase (filtering by ID and sorting by a timestamp like `createdAt` or `at`), this lack of indexing causes expensive in-memory sorts on large tables.
**Action:** When evaluating database schema performance, explicitly check for and add missing composite indexes (e.g. `@@index([userId, createdAt])`) on models heavily filtered by a foreign key and sorted by a timestamp to optimize common queries.
