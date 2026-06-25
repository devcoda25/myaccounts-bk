## 2024-05-18 - [Add Indexes to Chronological Queries]
**Learning:** Prisma `findMany` queries that use filtering (like by `userId`, `childId`, or `parentId`) combined with sorting (like `orderBy: { createdAt: "desc" }` or `at: "desc"`) will default to slow in-memory filesorts if a composite index covering both the foreign key and the sort field is missing.
**Action:** Add composite indexes such as `@@index([userId, createdAt])` and `@@index([childId, at])` on heavily queried tables to explicitly allow the database to skip sorting rows in memory.
