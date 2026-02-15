## 2024-05-22 - Missing Indexes on Core Tables
**Learning:** The `Notification` table, despite being a high-write/high-read table keyed by `userId`, lacked any indexes on `userId` or `createdAt`, leading to full table scans for user feeds.
**Action:** Always check `prisma/schema.prisma` for missing indexes on foreign keys and sort columns in high-frequency queries.
