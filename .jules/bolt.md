## 2026-06-08 - Optimize Database Queries with Composite Indexes
**Learning:** Prisma relies on precise composite indexes (e.g., `@@index([userId, createdAt])`) to prevent expensive in-memory sorts for chronological query access patterns commonly used in findMany queries with ordering.
**Action:** Add targeted composite indexes to models like Notification, SecurityReport, and SupportTicket to ensure sorting and filtering leverage the database directly.
