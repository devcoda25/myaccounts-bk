## 2025-02-27 - Composite Indexes for Support Queries
**Learning:** Found that `SupportRepository.findUserTickets` queries `SupportTicket` model by `userId` and sorts by `createdAt` descending, but lacked a matching composite index.
**Action:** Always verify query access patterns (filtering and sorting together) in Prisma and add appropriate composite indexes (e.g., `@@index([userId, createdAt(sort: Desc)])`) to optimize these combined operations.
