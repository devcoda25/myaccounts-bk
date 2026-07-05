## 2024-07-05 - Missing Composite Indexes in Prisma Schema
**Learning:** Found that frequently accessed queries filtering by a foreign key and sorting chronologically (e.g., `findManyByChildId` sorting by `at` desc) lack composite indexes in the Prisma schema. This causes expensive in-memory file sorts on the database.
**Action:** Always verify if a `findMany` query combining `where` and `orderBy` is backed by a composite index covering both fields in that exact order to avoid performance bottlenecks.
