## 2025-02-27 - [Add Composite Indexes]
**Learning:** Models like Notification, SecurityReport, and SupportTicket are frequently queried by userId and ordered by createdAt, requiring a composite index for optimal performance.
**Action:** Add `@@index([userId, createdAt(sort: Desc)])` to these models in schema.prisma and create corresponding SQL migration.
