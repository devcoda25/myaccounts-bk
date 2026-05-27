## 2026-05-27 - Add composite indexes for chronological relation queries
**Learning:** Prisma relies on composite indexes matching the exact foreign key and timestamp column to avoid expensive in-memory sorts when ordering relational queries (e.g. `findMany` by `userId` or `childId` ordered by `createdAt` or `at`).
**Action:** Always verify composite index existence on any model supporting paginated or chronological list queries.
