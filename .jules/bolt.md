## 2024-05-24 - [Missing Composite Indexes for Sorting]
**Learning:** Found several database queries that filter by a foreign key (like `userId` or `childId`) and sort by a timestamp (`createdAt`, `at`, `lastUsedAt`), but Prisma schema lacks the corresponding composite indexes (e.g. `@@index([userId, createdAt])`). This can cause slow queries and in-memory sorting.
**Action:** Add composite indexes to `Notification`, `SecurityReport`, `SupportTicket`, `ParentalApproval`, `ParentalActivity`, and `Session` in `prisma/schema.prisma` to support efficient querying and sorting.
