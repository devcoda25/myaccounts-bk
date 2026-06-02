## 2025-02-25 - [Prisma Chronological Queries]
**Learning:** Chronological query patterns on Notification, SecurityReport, SupportTicket, and Session models require composite indexes (e.g., @@index([userId, createdAt]) and @@index([userId, lastUsedAt])) to prevent expensive in-memory sorts.
**Action:** Add these composite indexes to prevent performance bottlenecks.
