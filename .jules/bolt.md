## 2024-03-23 - Prisma Foreign Key & Sort Indexes
**Learning:** Prisma on PostgreSQL does not automatically index foreign keys or composite fields used in sorting (e.g., querying by `userId` and sorting by `createdAt` descending). Models like Notification, SecurityReport, and SupportTicket are queried by user and sorted, causing sequential scans on large tables.
**Action:** Always add `@@index([userId, createdAt])` (or equivalent) for models queried by relation and sorted by time, to optimize performance and prevent in-memory sorts.
