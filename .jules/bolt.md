## 2025-02-27 - [Missing Chronological Indexes on Support and Security Tables]
**Learning:** Tables like `security_reports` and `support_tickets` are frequently queried by `userId` and sorted by `createdAt` in descending order, but lacked composite indexes. This causes slow in-memory sorts.
**Action:** Always verify that Prisma models queried with `findMany` and `orderBy` have a corresponding composite index with the correct sort direction, like `@@index([userId, createdAt(sort: Desc)])`.
