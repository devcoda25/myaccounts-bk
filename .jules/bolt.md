
## 2025-01-20 - Add composite indexes for chronological queries
**Learning:** Chronological query patterns on Notification, SecurityReport, SupportTicket, and Session models require composite indexes (e.g., `@@index([userId, createdAt])` and `@@index([userId, lastUsedAt])`) to prevent expensive in-memory sorts.
**Action:** Always explicitly check for and add missing indexes on Foreign Keys and sort columns in prisma/schema.prisma.
