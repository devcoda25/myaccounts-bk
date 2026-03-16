
## 2025-02-13 - [Prisma Indexing for Sorted Queries]
**Learning:** Prisma/PostgreSQL does not automatically index foreign key columns or compound fields frequently used for sorting (e.g., filtering by `childId` or `userId` and sorting by `at` or `createdAt`). This can lead to expensive in-memory sorts for common access patterns like fetching a user's latest sessions, parental activities, or support tickets.
**Action:** Always verify query access patterns using `orderBy` on timestamp fields in the repositories, and explicitly add composite indexes (e.g., `@@index([userId, createdAt])`) in `prisma/schema.prisma` for these models.
